# Builds web images from the cabinet photos and the LNT drawings/heatmap PDFs.
# Re-encoding through a fresh bitmap drops all EXIF metadata (including any location).
param([string]$Photos, [string]$Render, [string]$Out)
Add-Type -AssemblyName System.Drawing
$jpg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | ? { $_.MimeType -eq 'image/jpeg' }

function Build($src, [int[]]$crop, [int]$w, [int]$q, $dest, [int[][]]$blank = @()) {
  $img = [System.Drawing.Image]::FromFile($src)
  $cx, $cy, $cw, $ch = $crop
  $h = [int][Math]::Round($w * $ch / $cw)
  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::White)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'; $g.SmoothingMode = 'HighQuality'
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), (New-Object System.Drawing.Rectangle $cx, $cy, $cw, $ch), 'Pixel')
  $s = $w / $cw
  foreach ($r in $blank) { $g.FillRectangle([System.Drawing.Brushes]::White, [int](($r[0]-$cx)*$s), [int](($r[1]-$cy)*$s), [int]($r[2]*$s), [int]($r[3]*$s)) }
  $p = New-Object System.Drawing.Imaging.EncoderParameters 1
  [long]$ql = $q; $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $ql
  $bmp.Save($dest, $jpg, $p); $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  "{0} {1}x{2} {3:N0} KB" -f (Split-Path $dest -Leaf), $w, $h, ((Get-Item $dest).Length / 1KB)
}

$img = Join-Path $Out 'assets\img'
# Cabinet photos (1500x2000 originals)
Build (Join-Path $Photos '12.jpg') @(0, 0, 1500, 2000) 1050 76 (Join-Path $img 'cabinet-colour-coded-patching.jpg')
Build (Join-Path $Photos '13.jpg') @(150, 0, 1200, 1350) 1050 76 (Join-Path $img 'cabinet-patch-panels-switching.jpg')
# Predicted 5 GHz coverage, first floor (page rendered at 2400 wide); title block and page notes cropped off
Build (Join-Path $Render 'lnt-5.png') @(180, 240, 1770, 1188) 1600 86 (Join-Path $img 'wifi-heatmap-5ghz-first-floor.jpg')
# First-floor cable layout (rendered at 5400 wide); title block, legend and notes removed
Build (Join-Path $Render 'e701-3600.png') @(257, 689, 4941, 1606) 2000 90 (Join-Path $img 'cable-layout-first-floor.jpg') @(,@(4590, 689, 700, 450))
