# Builds the CareHomeWiFi web brand assets from the approved artwork.
#   powershell -File tools\brand-assets.ps1 -Src brand-src -Out repo
# Steps: decode (PNG/WebP) -> remove white background with colour unmixing
# (soft, true alpha edges) -> trim padding -> resize with high-quality
# resampling -> write PNGs, a light (reverse) logo, favicons, ICO and OG image.
param([string]$Src, [string]$Out)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationCore, WindowsBase, System.Drawing

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class Px {
  static byte[] Read(Bitmap b, out BitmapData d) {
    d = b.LockBits(new Rectangle(0,0,b.Width,b.Height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    var a = new byte[d.Stride*b.Height]; Marshal.Copy(d.Scan0, a, 0, a.Length); return a; }
  static void Write(Bitmap b, BitmapData d, byte[] a) { Marshal.Copy(a, 0, d.Scan0, a.Length); b.UnlockBits(d); }

  // White -> transparent. alpha from the darkest channel; colour un-mixed from white.
  public static void KnockOutWhite(Bitmap b, int fullAt) {
    BitmapData d; var p = Read(b, out d);
    for (int i = 0; i < p.Length; i += 4) {
      double sa = p[i+3] / 255.0; // composite any existing transparency onto white first
      int B = (int)Math.Round(p[i]*sa + 255*(1-sa)), G = (int)Math.Round(p[i+1]*sa + 255*(1-sa)), R = (int)Math.Round(p[i+2]*sa + 255*(1-sa));
      int min = Math.Min(R, Math.Min(G, B));
      double a = (255.0 - min) / (255.0 - fullAt); if (a > 1) a = 1; if (a < 0.06) a = 0;
      if (a == 0) { p[i]=p[i+1]=p[i+2]=p[i+3]=0; continue; }
      Func<int,byte> un = c => (byte)Math.Max(0, Math.Min(255, Math.Round((c - (1-a)*255) / a)));
      p[i] = un(B); p[i+1] = un(G); p[i+2] = un(R); p[i+3] = (byte)Math.Round(a*255);
    }
    Write(b, d, p);
  }
  // Bounding box of pixels with alpha above threshold.
  public static Rectangle Bounds(Bitmap b, int thr) {
    BitmapData d; var p = Read(b, out d); int w=b.Width,h=b.Height,minX=w,minY=h,maxX=-1,maxY=-1;
    for (int y=0;y<h;y++) for (int x=0;x<w;x++) if (p[y*d.Stride+x*4+3] > thr) { if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
    b.UnlockBits(d); return maxX<0 ? Rectangle.Empty : Rectangle.FromLTRB(minX,minY,maxX+1,maxY+1);
  }
  // Recolour the navy parts (low green) to a light tone for dark backgrounds; teal kept.
  public static void Lighten(Bitmap b, byte r, byte g, byte bl) {
    BitmapData d; var p = Read(b, out d);
    for (int i = 0; i < p.Length; i += 4) { if (p[i+3]==0) continue; int G = p[i+1], B = p[i];
      bool navy = G < 85 && B < 110; if (navy) { p[i]=bl; p[i+1]=g; p[i+2]=r; } }
    Write(b, d, p);
  }
  // Report colour statistics (for QA).
  public static string Stats(Bitmap b) {
    BitmapData d; var p = Read(b, out d); long n=0, navy=0, teal=0, partial=0;
    for (int i=0;i<p.Length;i+=4){ if(p[i+3]==0) continue; n++; if(p[i+3]<250) partial++; if(p[i+1]<85&&p[i]<110) navy++; else if(p[i+1]>90) teal++; }
    b.UnlockBits(d); return string.Format("opaque/soft px={0} soft-edge={1} navy={2} teal={3}", n, partial, navy, teal);
  }
}
"@

function Load([string]$path) {
  $fs = [IO.File]::OpenRead((Resolve-Path $path))
  try {
    $dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($fs, 'PreservePixelFormat', 'OnLoad')
    $frame = New-Object System.Windows.Media.Imaging.FormatConvertedBitmap($dec.Frames[0], [System.Windows.Media.PixelFormats]::Bgra32, $null, 0)
    $w = $frame.PixelWidth; $h = $frame.PixelHeight; $stride = $w * 4
    $buf = New-Object byte[] ($stride * $h); $frame.CopyPixels($buf, $stride, 0)
    $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bd = $bmp.LockBits((New-Object System.Drawing.Rectangle 0,0,$w,$h), 'WriteOnly', $bmp.PixelFormat)
    [Runtime.InteropServices.Marshal]::Copy($buf, 0, $bd.Scan0, $buf.Length); $bmp.UnlockBits($bd)
    return $bmp
  } finally { $fs.Dispose() }
}
function Crop($bmp, $rect, [double]$padPct) {
  $pad = [int][Math]::Round([Math]::Max($rect.Width, $rect.Height) * $padPct)
  $out = New-Object System.Drawing.Bitmap ($rect.Width + 2*$pad), ($rect.Height + 2*$pad), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($out); $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($bmp, (New-Object System.Drawing.Rectangle $pad,$pad,$rect.Width,$rect.Height), $rect, 'Pixel'); $g.Dispose(); return $out
}
function Resize($bmp, [int]$w, [int]$h, $bg) {
  $out = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode='HighQualityBicubic'; $g.SmoothingMode='HighQuality'; $g.PixelOffsetMode='HighQuality'; $g.CompositingQuality='HighQuality'
  if ($bg) { $g.Clear($bg) } else { $g.Clear([System.Drawing.Color]::Transparent) }
  $ia = New-Object System.Drawing.Imaging.ImageAttributes; $ia.SetWrapMode('TileFlipXY')
  $g.DrawImage($bmp, (New-Object System.Drawing.Rectangle 0,0,$w,$h), 0,0,$bmp.Width,$bmp.Height, 'Pixel', $ia); $g.Dispose(); return $out
}
# Fit artwork centred into a square canvas with a margin (for icons).
function Square($bmp, [int]$size, [double]$margin, $bg) {
  $inner = [int][Math]::Round($size * (1 - 2*$margin)); $scale = [Math]::Min($inner / $bmp.Width, $inner / $bmp.Height)
  $w = [int][Math]::Round($bmp.Width*$scale); $h = [int][Math]::Round($bmp.Height*$scale)
  $scaled = Resize $bmp $w $h $null
  $out = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($out); if ($bg) { $g.Clear($bg) } else { $g.Clear([System.Drawing.Color]::Transparent) }
  $g.DrawImage($scaled, [int](($size-$w)/2), [int](($size-$h)/2), $w, $h); $g.Dispose(); $scaled.Dispose(); return $out
}
function SavePng($bmp, [string]$path) { $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); "{0,-48} {1}x{2}  {3:N1} KB" -f (Split-Path $path -Leaf), $bmp.Width, $bmp.Height, ((Get-Item $path).Length/1KB) }

$brand = Join-Path $Out 'assets\brand'; New-Item -ItemType Directory -Force $brand | Out-Null

# ---- masters: knock out background, trim -----------------------------------
$masters = @{}
foreach ($k in 'horizontal','stacked','monogram','monogram-favicon') {
  $file = Get-ChildItem $Src -Filter "$k.*" | Select-Object -First 1
  $b = Load $file.FullName
  "source {0}: {1}x{2}" -f $file.Name, $b.Width, $b.Height
  [Px]::KnockOutWhite($b, 60)
  $r = [Px]::Bounds($b, 25)
  $m = Crop $b $r 0.02; $b.Dispose()
  "  trimmed to {0}x{1}; {2}" -f $m.Width, $m.Height, [Px]::Stats($m)
  $masters[$k] = $m
}

# ---- website logos ---------------------------------------------------------
$h = $masters['horizontal']; $w2 = 520; $hh = [int][Math]::Round($h.Height * $w2 / $h.Width)
$o = Resize $h $w2 $hh $null; SavePng $o (Join-Path $brand 'carehomewifi-logo-horizontal.png'); $o.Dispose()
$light = $h.Clone(); [Px]::Lighten($light, 247, 246, 242)
$o = Resize $light $w2 $hh $null; SavePng $o (Join-Path $brand 'carehomewifi-logo-light.png'); $o.Dispose()
$s = $masters['stacked']; $sw = 600; $sh = [int][Math]::Round($s.Height * $sw / $s.Width)
$o = Resize $s $sw $sh $null; SavePng $o (Join-Path $brand 'carehomewifi-logo-stacked.png'); $o.Dispose()
$mono = $masters['monogram']; $o = Square $mono 512 0.04 $null; SavePng $o (Join-Path $brand 'carehomewifi-monogram.png'); $o.Dispose()

# ---- favicons (from the simplified monogram) --------------------------------
$fav = $masters['monogram-favicon']
$ivory = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
$icoParts = @()
foreach ($n in 16, 32, 48) {
  $o = Square $fav $n 0.02 $null; $p = Join-Path $Out "favicon-${n}x${n}.png"; SavePng $o $p; $o.Dispose(); $icoParts += ,@($n, [IO.File]::ReadAllBytes($p))
}
$o = Square $fav 180 0.12 $ivory; SavePng $o (Join-Path $Out 'apple-touch-icon.png'); $o.Dispose()
foreach ($n in 192, 512) { $o = Square $fav $n 0.10 $ivory; SavePng $o (Join-Path $Out "android-chrome-${n}x${n}.png"); $o.Dispose() }

# favicon.ico with PNG-encoded 16/32/48 entries
$ms = New-Object IO.MemoryStream; $bw = New-Object IO.BinaryWriter($ms)
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$icoParts.Count)
$offset = 6 + 16 * $icoParts.Count
foreach ($part in $icoParts) { $n=$part[0]; $data=$part[1]
  $bw.Write([byte]$n); $bw.Write([byte]$n); $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([UInt16]1); $bw.Write([UInt16]32)
  $bw.Write([UInt32]$data.Length); $bw.Write([UInt32]$offset); $offset += $data.Length }
foreach ($part in $icoParts) { $bw.Write($part[1]) }
[IO.File]::WriteAllBytes((Join-Path $Out 'favicon.ico'), $ms.ToArray()); "favicon.ico  16/32/48  {0:N1} KB" -f ($ms.Length/1KB)

# ---- Open Graph image: genuine project photo + light logo on a navy band ----
$photo = [System.Drawing.Image]::FromFile((Resolve-Path (Join-Path $Out 'assets\img\case-lnt-exterior.jpg')))
$og = New-Object System.Drawing.Bitmap 1200, 630, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($og); $g.InterpolationMode='HighQualityBicubic'; $g.SmoothingMode='HighQuality'; $g.PixelOffsetMode='HighQuality'
$bandH = 150; $areaH = 630 - $bandH
$scale = [Math]::Max(1200 / $photo.Width, $areaH / $photo.Height); $pw = $photo.Width*$scale; $ph = $photo.Height*$scale
$g.DrawImage($photo, [single]((1200-$pw)/2), [single]((($areaH)-$ph)/2 + 20), [single]$pw, [single]$ph)
$g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0x17, 0x2B, 0x3A))), 0, $areaH, 1200, $bandH)
$lw = 520; $lh = [int][Math]::Round($light.Height * $lw / $light.Width)
$lg = Resize $light $lw $lh $null; $g.DrawImage($lg, 60, [int]($areaH + ($bandH-$lh)/2), $lw, $lh); $lg.Dispose()
$g.Dispose(); $photo.Dispose()
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1; [long]$q = 84; $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $q)
$ogPath = Join-Path $brand 'og-default.jpg'; $og.Save($ogPath, $codec, $ep); "og-default.jpg  1200x630  {0:N1} KB" -f ((Get-Item $ogPath).Length/1KB); $og.Dispose()
$light.Dispose(); foreach ($m in $masters.Values) { $m.Dispose() }
