param(
    [double]$Amount = 4700.00,
    [string]$Bank = 'Krungthai Connext'
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      Windows Toast Notification Simulator (Krungthai)     " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$formattedAmount = "{0:N2}" -f $Amount
Write-Host "จำลองยอดเงินเข้า : $formattedAmount บาท" -ForegroundColor Green
Write-Host "ช่องทางแจ้งเตือน: $Bank (LINE Desktop)" -ForegroundColor Green

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$timeStr = (Get-Date).ToString("HH:mm")
$xmlString = "<toast><visual><binding template='ToastGeneric'><text>LINE - " + $Bank + "</text><text>เงินเข้า " + $formattedAmount + " บาท จาก บัญชี xxx-x-xx123-x เวลา " + $timeStr + " น.</text><text>เข้าบัญชี 099-614-4478 (DormEase Residence)</text></binding></visual></toast>"

$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($xmlString)

$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
$appId = "{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe"

[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)

Write-Host ""
Write-Host "[OK] ส่ง Notification ไปยังหน้าจอ Windows เรียบร้อยแล้ว!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
