Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "resources\icon.jpeg"
$dstPath = Join-Path (Split-Path $srcPath -Parent) "icon.ico"

$srcImage = [System.Drawing.Image]::FromFile($srcPath.ToString())

$sizes = @(16, 32, 48, 256)
$pngDataList = @()

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcImage, 0, 0, $size, $size)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngDataList += , ($ms.ToArray())
    $bmp.Dispose()
    $ms.Dispose()
}

$srcImage.Dispose()

# ── Assemble ICO binary ───────────────────────────────────────────────────────
# ICO format: 6-byte ICONDIR + N*16-byte ICONDIRENTRY + N PNG blobs

$ms     = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($ms)

# ICONDIR
$writer.Write([uint16]0)              # reserved
$writer.Write([uint16]1)              # type = 1 (icon)
$writer.Write([uint16]$sizes.Count)   # image count

# First image data starts after: 6 (header) + count*16 (entries)
$offset = 6 + $sizes.Count * 16

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $size = $sizes[$i]
    $data = $pngDataList[$i]
    $dim  = if ($size -eq 256) { 0 } else { $size }

    $writer.Write([byte]$dim)          # width  (0 = 256)
    $writer.Write([byte]$dim)          # height (0 = 256)
    $writer.Write([byte]0)             # colour count
    $writer.Write([byte]0)             # reserved
    $writer.Write([uint16]1)           # colour planes
    $writer.Write([uint16]32)          # bits per pixel
    $writer.Write([uint32]$data.Length)
    $writer.Write([uint32]$offset)
    $offset += $data.Length
}

foreach ($data in $pngDataList) {
    $writer.Write($data)
}

$writer.Flush()
$icoBytes = $ms.ToArray()
$writer.Dispose()
$ms.Dispose()

[System.IO.File]::WriteAllBytes($dstPath.ToString(), $icoBytes)
Write-Host "Done: $dstPath  ($($sizes -join ', ')px)"
