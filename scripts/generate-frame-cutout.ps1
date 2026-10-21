<#
.SYNOPSIS
  Generates the transparent "photo window" version of the PiTech frame.

.DESCRIPTION
  The frame artwork (ASSETS\frame.png) is fully opaque, so the photo has no
  room to sit inside it. This script flood-fills the white area that forms the
  photo window and writes a copy of the frame with that area made transparent.
  The app then layers the photo underneath the cut-out frame, which makes the
  photo visible through the window with a pixel-perfect edge.

.PARAMETER InputPath
  Path to the original frame artwork. Defaults to ASSETS\frame.png.

.PARAMETER OutputPath
  Where the cut-out frame is written. Defaults to src\assets\frame-cutout.png.

.EXAMPLE
  pwsh -File scripts\generate-frame-cutout.ps1
#>
param(
  [string]$InputPath = (Join-Path $PSScriptRoot "..\ASSETS\frame.png"),
  [string]$OutputPath = (Join-Path $PSScriptRoot "..\src\assets\frame-cutout.png")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$InputPath = (Resolve-Path $InputPath).Path
$OutputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$bmp = New-Object System.Drawing.Bitmap $InputPath
$w = $bmp.Width
$h = $bmp.Height
$rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$locked = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $locked.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($locked.Scan0, $bytes, 0, [int]($stride * $h))
$bmp.UnlockBits($locked)

function Test-CorePixel($x, $y) {
  $i = $y * $stride + $x * 4
  $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]
  $max = [Math]::Max($r, [Math]::Max($g, $b))
  $min = [Math]::Min($r, [Math]::Min($g, $b))
  return ($min -ge 235 -and ($max - $min) -le 20)
}

function Get-Luminance($x, $y) {
  $i = $y * $stride + $x * 4
  return (0.299 * $bytes[$i + 2] + 0.587 * $bytes[$i + 1] + 0.114 * $bytes[$i])
}

# 1. Flood fill the photo window starting from its centre.
$core = New-Object byte[] ($w * $h)
$stack = New-Object System.Collections.Generic.Stack[int]
$seed = [int]($h / 2) * $w + [int]($w / 2)
$core[$seed] = 1
$stack.Push($seed)
while ($stack.Count -gt 0) {
  $idx = $stack.Pop()
  $x = $idx % $w
  $y = [Math]::Floor($idx / $w)
  if ($x -gt 0)     { $n = $idx - 1;     if ($core[$n] -eq 0 -and (Test-CorePixel ($x - 1) $y)) { $core[$n] = 1; $stack.Push($n) } }
  if ($x -lt $w - 1) { $n = $idx + 1;     if ($core[$n] -eq 0 -and (Test-CorePixel ($x + 1) $y)) { $core[$n] = 1; $stack.Push($n) } }
  if ($y -gt 0)     { $n = $idx - $w;    if ($core[$n] -eq 0 -and (Test-CorePixel $x ($y - 1))) { $core[$n] = 1; $stack.Push($n) } }
  if ($y -lt $h - 1) { $n = $idx + $w;    if ($core[$n] -eq 0 -and (Test-CorePixel $x ($y + 1))) { $core[$n] = 1; $stack.Push($n) } }
}

# 2. Grow the cut-out 2px into the anti-aliased edge so the frame stays crisp.
$hole = New-Object byte[] ($w * $h)
[Array]::Copy($core, $hole, $core.Length)
for ($pass = 0; $pass -lt 2; $pass++) {
  $grow = New-Object System.Collections.Generic.List[int]
  for ($y = 1; $y -lt $h - 1; $y++) {
    for ($x = 1; $x -lt $w - 1; $x++) {
      if ($hole[$y * $w + $x] -eq 1) { continue }
      if ($hole[$y * $w + $x - 1] -eq 1 -or $hole[$y * $w + $x + 1] -eq 1 -or
          $hole[($y - 1) * $w + $x] -eq 1 -or $hole[($y + 1) * $w + $x] -eq 1) {
        if ((Get-Luminance $x $y) -ge 140) { $grow.Add($y * $w + $x) }
      }
    }
  }
  foreach ($g in $grow) { $hole[$g] = 1 }
}

# 3. Write the frame back out with the window transparent.
$outBmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$outRect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$outLocked = $outBmp.LockBits($outRect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$outStride = $outLocked.Stride
$outBytes = New-Object byte[] ($outStride * $h)
$copyLength = [Math]::Min($stride * $h, $outStride * $h)
[System.Buffer]::BlockCopy($bytes, 0, $outBytes, 0, [int]$copyLength)
for ($y = 0; $y -lt $h; $y++) {
  $row = $y * $stride
  for ($x = 0; $x -lt $w; $x++) {
    if ($hole[$y * $w + $x] -eq 1) { $outBytes[$row + $x * 4 + 3] = 0 }
  }
}
[System.Runtime.InteropServices.Marshal]::Copy($outBytes, 0, $outLocked.Scan0, [int]($outStride * $h))
$outBmp.UnlockBits($outLocked)
$outBmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$outBmp.Dispose()
$bmp.Dispose()

Write-Host "Wrote $OutputPath"
