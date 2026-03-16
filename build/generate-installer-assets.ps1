# generate-installer-assets.ps1
# Generates NSIS installer BMP assets using System.Drawing (built-in .NET).
# Run once, commit the output BMPs. No external tools required.
#
# Output:
#   build/installerSidebar.bmp  (164x314)  — welcome/finish page sidebar
#   build/installerHeader.bmp   (150x57)   — page header strip

Add-Type -AssemblyName System.Drawing

$outDir = $PSScriptRoot

# ─── Colors ──────────────────────────────────────────────────────────────────

$colorDark     = [System.Drawing.Color]::FromArgb(30, 27, 75)     # indigo-950
$colorMid      = [System.Drawing.Color]::FromArgb(49, 46, 129)    # indigo-900
$colorAccent   = [System.Drawing.Color]::FromArgb(129, 140, 248)  # indigo-400
$colorLight    = [System.Drawing.Color]::FromArgb(165, 180, 252)  # indigo-300
$colorWhite    = [System.Drawing.Color]::White

# ─── Fonts ───────────────────────────────────────────────────────────────────

$fontTitle  = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
$fontSub    = New-Object System.Drawing.Font('Segoe UI', 9)
$fontHeader = New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)

# ─── Sidebar (164x314) ──────────────────────────────────────────────────────

$w = 164; $h = 314
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = 'HighQuality'
$g.TextRenderingHint = 'AntiAliasGridFit'

# Gradient background
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new(0, $h),
    $colorDark,
    $colorMid
)
$g.FillRectangle($gradBrush, 0, 0, $w, $h)

# Decorative diamond icon (centered near top)
$iconBrush = New-Object System.Drawing.SolidBrush($colorAccent)
$iconPoints = @(
    [System.Drawing.Point]::new(82, 60),
    [System.Drawing.Point]::new(110, 88),
    [System.Drawing.Point]::new(82, 116),
    [System.Drawing.Point]::new(54, 88)
)
$g.FillPolygon($iconBrush, $iconPoints)

# Inner diamond (darker)
$innerBrush = New-Object System.Drawing.SolidBrush($colorMid)
$innerPoints = @(
    [System.Drawing.Point]::new(82, 72),
    [System.Drawing.Point]::new(98, 88),
    [System.Drawing.Point]::new(82, 104),
    [System.Drawing.Point]::new(66, 88)
)
$g.FillPolygon($innerBrush, $innerPoints)

# Accent line
$pen = New-Object System.Drawing.Pen($colorAccent, 2)
$g.DrawLine($pen, 20, 240, 144, 240)

# App name
$whiteBrush = New-Object System.Drawing.SolidBrush($colorWhite)
$g.DrawString('DeskFlow', $fontTitle, $whiteBrush, 15, 250)

# Tagline
$lightBrush = New-Object System.Drawing.SolidBrush($colorLight)
$g.DrawString('Desktop Session Manager', $fontSub, $lightBrush, 15, 280)

$g.Dispose()
$gradBrush.Dispose()
$bmp.Save("$outDir\installerSidebar.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)
$bmp.Dispose()
Write-Host "Created: $outDir\installerSidebar.bmp (164x314)"

# ─── Header (150x57) ────────────────────────────────────────────────────────

$w = 150; $h = 57
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = 'HighQuality'
$g.TextRenderingHint = 'AntiAliasGridFit'

# Gradient background
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new($w, 0),
    $colorDark,
    $colorMid
)
$g.FillRectangle($gradBrush, 0, 0, $w, $h)

# Small diamond accent
$smallPoints = @(
    [System.Drawing.Point]::new(16, 28),
    [System.Drawing.Point]::new(28, 16),
    [System.Drawing.Point]::new(40, 28),
    [System.Drawing.Point]::new(30, 40)
)
$g.FillPolygon($iconBrush, $smallPoints)

# App name
$g.DrawString('DeskFlow', $fontHeader, $whiteBrush, 46, 17)

$g.Dispose()
$gradBrush.Dispose()
$bmp.Save("$outDir\installerHeader.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)
$bmp.Dispose()
Write-Host "Created: $outDir\installerHeader.bmp (150x57)"

# ─── Cleanup ─────────────────────────────────────────────────────────────────

$fontTitle.Dispose()
$fontSub.Dispose()
$fontHeader.Dispose()
$iconBrush.Dispose()
$innerBrush.Dispose()
$whiteBrush.Dispose()
$lightBrush.Dispose()
$pen.Dispose()

Write-Host "`nDone. Commit the .bmp files to build/"
