Add-Type -AssemblyName System.Drawing

$buildDir = "public"

$logoPath = "public\logo_icon.png"

# --- Sidebar (164x314) ---
$sidebarWidth = 164
$sidebarHeight = 314
$sidebarBmp = [System.Drawing.Bitmap]::new($sidebarWidth, $sidebarHeight)
$sidebarGraphics = [System.Drawing.Graphics]::FromImage($sidebarBmp)

$rect = [System.Drawing.Rectangle]::new(0, 0, $sidebarWidth, $sidebarHeight)
$c1 = [System.Drawing.ColorTranslator]::FromHtml("#0f172a")
$c2 = [System.Drawing.ColorTranslator]::FromHtml("#10b981")
$brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, $c1, $c2, 90.0)
$sidebarGraphics.FillRectangle($brush, $rect)

try {
    $logoImg = [System.Drawing.Image]::FromFile($logoPath)
    $logoWidth = 100
    $logoHeight = ($logoImg.Height / $logoImg.Width) * $logoWidth
    $logoX = ($sidebarWidth - $logoWidth) / 2
    $logoY = ($sidebarHeight - $logoHeight) / 2
    $sidebarGraphics.DrawImage($logoImg, [int]$logoX, [int]$logoY, [int]$logoWidth, [int]$logoHeight)
    $logoImg.Dispose()
}
catch {
    Write-Host "Could not draw logo on sidebar."
}

$font = [System.Drawing.Font]::new("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$textBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$format = [System.Drawing.StringFormat]::new()
$format.Alignment = [System.Drawing.StringAlignment]::Center
$rectF = [System.Drawing.RectangleF]::new(0, ($sidebarHeight - 40), $sidebarWidth, 40)
$sidebarGraphics.DrawString("Prof. Acerta+", $font, $textBrush, $rectF, $format)

$sidebarBmp.Save("$buildDir\installerSidebar.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)
$sidebarGraphics.Dispose()
$sidebarBmp.Dispose()

# --- Header (150x57) ---
$headerWidth = 150
$headerHeight = 57
$headerBmp = [System.Drawing.Bitmap]::new($headerWidth, $headerHeight)
$headerGraphics = [System.Drawing.Graphics]::FromImage($headerBmp)

$bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$headerGraphics.FillRectangle($bgBrush, 0, 0, $headerWidth, $headerHeight)

try {
    $logoImgHeader = [System.Drawing.Image]::FromFile($logoPath)
    $logoWidth = 40
    $logoHeight = ($logoImgHeader.Height / $logoImgHeader.Width) * $logoWidth
    $logoX = $headerWidth - $logoWidth - 10
    $logoY = ($headerHeight - $logoHeight) / 2
    $headerGraphics.DrawImage($logoImgHeader, [int]$logoX, [int]$logoY, [int]$logoWidth, [int]$logoHeight)
    $logoImgHeader.Dispose()
}
catch {}

$fontHeader = [System.Drawing.Font]::new("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$textBrushHeader = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#0f172a"))
$headerGraphics.DrawString("Prof. Acerta+", $fontHeader, $textBrushHeader, 10, ($headerHeight - 20) / 2)

$headerBmp.Save("$buildDir\installerHeader.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)
$headerGraphics.Dispose()
$headerBmp.Dispose()

Write-Host "Installer assets generated successfully in \public folder."
