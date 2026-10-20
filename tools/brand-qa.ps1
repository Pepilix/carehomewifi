# QA contact sheet: logos on white / ivory / navy, favicons at 1:1 and enlarged.
param([string]$Root, [string]$OutFile)
Add-Type -AssemblyName System.Drawing
$W = 1500; $H = 1150
$sheet = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($sheet); $g.Clear([System.Drawing.Color]::FromArgb(230,230,230))
$bgs = @(@('white',[System.Drawing.Color]::White), @('ivory',[System.Drawing.Color]::FromArgb(0xF7,0xF6,0xF2)), @('navy',[System.Drawing.Color]::FromArgb(0x17,0x2B,0x3A)))
$font = New-Object System.Drawing.Font('Segoe UI', 11)
function Img($p) { [System.Drawing.Image]::FromFile((Join-Path $Root $p)) }
$y = 10
foreach ($bg in $bgs) {
  $g.FillRectangle((New-Object System.Drawing.SolidBrush $bg[1]), 10, $y, $W-20, 170)
  $g.DrawString($bg[0], $font, [System.Drawing.Brushes]::Gray, 16, $y+4)
  $logo = if ($bg[0] -eq 'navy') { Img 'assets\brand\carehomewifi-logo-light.png' } else { Img 'assets\brand\carehomewifi-logo-horizontal.png' }
  $g.DrawImage($logo, 40, $y+40, 400, [int](400*$logo.Height/$logo.Width))          # large
  $g.DrawImage($logo, 520, $y+70, 220, [int](220*$logo.Height/$logo.Width))         # header size
  $mono = Img 'assets\brand\carehomewifi-monogram.png'; $g.DrawImage($mono, 820, $y+20, 130, 130)
  $st = Img 'assets\brand\carehomewifi-logo-stacked.png'; $g.DrawImage($st, 1000, $y+20, 220, [int](220*$st.Height/$st.Width))
  $y += 185
}
# favicons at real size and 8x nearest-neighbour
$g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'
$x = 30; foreach ($n in 16,32,48) { $f = Img "favicon-${n}x${n}.png"
  $g.FillRectangle([System.Drawing.Brushes]::White, $x-5, $y+5, 420, 420)
  $g.DrawImage($f, $x, $y+10, $n, $n); $g.DrawImage($f, $x, $y+70, [Math]::Min(48*8, $n*8), [Math]::Min(48*8, $n*8)); $x += 440 }
$y += 440
$g.InterpolationMode = 'HighQualityBicubic'
$at = Img 'apple-touch-icon.png'; $g.DrawImage($at, 30, $y+10, 180, 180)
$og = Img 'assets\brand\og-default.jpg'; $g.DrawImage($og, 260, $y+10, 380, 200)
$sheet.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); "saved $OutFile"
