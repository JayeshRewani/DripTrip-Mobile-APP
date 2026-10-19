# Generates DripTrip launcher icons (Android mipmaps + iOS AppIcon) from the store logo.
# Usage (from repo root): powershell -ExecutionPolicy Bypass -File branding\make-icons.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;

public static class Monogram {
    // Keeps the "d" glyph (component touching the left edge) and the three dots
    // (components fully above dotMaxY); everything else (the rest of the wordmark) is dropped.
    public static Bitmap Extract(Bitmap src, int dotMaxY) {
        int w = src.Width, h = src.Height;
        int[] label = new int[w * h];
        var keep = new HashSet<int>();
        int next = 1;
        for (int y = 0; y < h; y++)
        for (int x = 0; x < w; x++) {
            int i = y * w + x;
            if (label[i] != 0 || src.GetPixel(x, y).A < 30) continue;
            int id = next++;
            int minX = x, maxY = y;
            var stack = new Stack<int>();
            stack.Push(i); label[i] = id;
            while (stack.Count > 0) {
                int p = stack.Pop(); int px = p % w, py = p / w;
                if (px < minX) minX = px; if (py > maxY) maxY = py;
                for (int dy = -1; dy <= 1; dy++)
                for (int dx = -1; dx <= 1; dx++) {
                    int nx = px + dx, ny = py + dy;
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                    int n = ny * w + nx;
                    if (label[n] == 0 && src.GetPixel(nx, ny).A >= 30) { label[n] = id; stack.Push(n); }
                }
            }
            if (minX <= 6 || maxY < dotMaxY) keep.Add(id);
        }
        int bx0 = w, by0 = h, bx1 = 0, by1 = 0;
        for (int i = 0; i < w * h; i++) if (keep.Contains(label[i])) {
            int x = i % w, y = i / w;
            if (x < bx0) bx0 = x; if (y < by0) by0 = y; if (x > bx1) bx1 = x; if (y > by1) by1 = y;
        }
        var outBmp = new Bitmap(bx1 - bx0 + 1, by1 - by0 + 1);
        for (int y = by0; y <= by1; y++)
        for (int x = bx0; x <= bx1; x++) {
            int i = y * w + x;
            // keep antialiased edge pixels next to kept components
            bool near = keep.Contains(label[i]);
            if (!near) for (int dy = -1; dy <= 1 && !near; dy++) for (int dx = -1; dx <= 1 && !near; dx++) {
                int nx = x + dx, ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < w && ny < h && keep.Contains(label[ny * w + nx])) near = true;
            }
            outBmp.SetPixel(x - bx0, y - by0, near ? src.GetPixel(x, y) : Color.Transparent);
        }
        return outBmp;
    }
}
"@

$root = Split-Path -Parent $PSScriptRoot
$logo = [System.Drawing.Bitmap]::FromFile((Join-Path $PSScriptRoot 'driptrip-logo.png'))
$mono = [Monogram]::Extract($logo, 70)
$mono.Save((Join-Path $PSScriptRoot 'monogram.png'), [System.Drawing.Imaging.ImageFormat]::Png)

function New-Icon([int]$size, [double]$scale, [bool]$round, [bool]$transparentBg) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
    $g.Clear([System.Drawing.Color]::Transparent)
    if (-not $transparentBg) {
        $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
        if ($round) { $g.FillEllipse($bg, 0, 0, $size, $size) } else { $g.FillRectangle($bg, 0, 0, $size, $size) }
    }
    $box = $size * $scale
    $ratio = [Math]::Min($box / $mono.Width, $box / $mono.Height)
    $mw = $mono.Width * $ratio; $mh = $mono.Height * $ratio
    $g.DrawImage($mono, [single](($size - $mw) / 2), [single](($size - $mh) / 2), [single]$mw, [single]$mh)
    $g.Dispose()
    return $bmp
}

function Save-Png($bmp, $path) {
    New-Item -ItemType Directory -Force -Path (Split-Path $path) | Out-Null
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}

$res = Join-Path $root 'android\app\src\main\res'
$densities = @{ 'mdpi' = 1; 'hdpi' = 1.5; 'xhdpi' = 2; 'xxhdpi' = 3; 'xxxhdpi' = 4 }
foreach ($d in $densities.Keys) {
    $f = $densities[$d]
    Save-Png (New-Icon ([int](48 * $f)) 0.62 $false $false) (Join-Path $res "mipmap-$d\ic_launcher.png")
    Save-Png (New-Icon ([int](48 * $f)) 0.56 $true $false) (Join-Path $res "mipmap-$d\ic_launcher_round.png")
    # Adaptive icon foreground: 108dp canvas, artwork inside the 66dp safe zone
    Save-Png (New-Icon ([int](108 * $f)) 0.40 $false $true) (Join-Path $res "mipmap-$d\ic_launcher_foreground.png")
}

$ios = Join-Path $root 'ios\DripTrip\Images.xcassets\AppIcon.appiconset'
$iosSizes = [ordered]@{
    'icon-20@2x.png' = 40; 'icon-20@3x.png' = 60; 'icon-29@2x.png' = 58; 'icon-29@3x.png' = 87;
    'icon-40@2x.png' = 80; 'icon-40@3x.png' = 120; 'icon-60@2x.png' = 120; 'icon-60@3x.png' = 180;
    'icon-1024.png' = 1024
}
foreach ($name in $iosSizes.Keys) { Save-Png (New-Icon $iosSizes[$name] 0.62 $false $false) (Join-Path $ios $name) }
Save-Png (New-Icon 1024 0.62 $false $false) (Join-Path $PSScriptRoot 'icon-1024.png')

$mono.Dispose(); $logo.Dispose()
Write-Host 'Icons generated.'
