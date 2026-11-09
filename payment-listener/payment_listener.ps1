<#
 ==============================================================================
  DormEase Windows Payment Notification Listener
  ตรวจจับการแจ้งเตือนเงินเข้าจาก LINE Desktop (Krungthai Connext) บน Windows
  และส่งยอดเงินไปจับคู่ Invoice บนระบบหอพักอัตโนมัติ
 ==============================================================================
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "DormEase - Windows Payment Notification Listener"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   DormEase Payment Listener (LINE Desktop / Krungthai Connext)   " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. โหลดการตั้งค่าจาก config.json
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir "config.json"

if (-not (Test-Path $configPath)) {
    Write-Host "[ERROR] ไม่พบไฟล์ $configPath" -ForegroundColor Red
    pause
    exit
}

$config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$apiUrl = $config.api_url
$apiKey = $config.api_key
$pollInterval = if ($config.poll_interval_seconds) { $config.poll_interval_seconds } else { 3 }

Write-Host "API Endpoint : $apiUrl" -ForegroundColor Gray
Write-Host "Target Apps  : $($config.target_app_keywords -join ', ')" -ForegroundColor Gray
Write-Host "Poll Interval: $pollInterval วินาที" -ForegroundColor Gray
Write-Host "Status       : กำลังเริ่มระบบตรวจจับ Windows Notification..." -ForegroundColor Green
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

# 2. เตรียม Windows Runtime UserNotificationListener
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and 
    $_.GetParameters().Count -eq 1 -and 
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

[Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.UI.Notifications.NotificationKinds, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null

$listener = [Windows.UI.Notifications.Management.UserNotificationListener]::Current
$accessStatus = Await ($listener.RequestAccessAsync()) ([Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus])

if ($accessStatus -ne "Allowed") {
    Write-Host "[WARNING] Windows ยังไม่อนุญาตให้เข้าถึง Notifications (สถานะ: $accessStatus)" -ForegroundColor Yellow
    Write-Host "กรุณาเปิดการอนุญาตใน: Windows Settings > Privacy & security > Notifications" -ForegroundColor Yellow
} else {
    Write-Host "[OK] ได้รับสิทธิ์เข้าถึง Windows Notifications เรียบร้อยแล้ว" -ForegroundColor Green
}

# 3. จัดการบันทึก ID ที่เคยประมวลผลแล้ว (Client-side Idempotency Cache)
$processedFile = Join-Path $scriptDir "processed_ids.txt"
$processedIds = @{}
if (Test-Path $processedFile) {
    Get-Content $processedFile | ForEach-Object {
        if ($_ -and $_.Trim()) { $processedIds[$_.Trim()] = $true }
    }
}

function SaveProcessedId($id) {
    $processedIds[$id] = $true
    Add-Content -Path $processedFile -Value $id
}

Write-Host "พร้อมรับการแจ้งเตือนแล้ว... (กด Ctrl+C เพื่อหยุดทำงาน)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Gray

# 4. ลูปตรวจจับการแจ้งเตือน
while ($true) {
    try {
        $notifications = Await ($listener.GetNotificationsAsync([Windows.UI.Notifications.NotificationKinds]::Toast)) ([System.Collections.Generic.IReadOnlyList[Windows.UI.Notifications.UserNotification]])
        
        foreach ($n in $notifications) {
            $notifId = "WIN-$($n.Id)-$($n.CreationTime.ToString('yyyyMMddHHmmss'))"
            
            if ($processedIds.ContainsKey($notifId)) {
                continue
            }
            
            $appName = $n.AppInfo.DisplayInfo.DisplayName
            
            # ตรวจสอบว่าเป็น Notification จาก LINE หรือมีคำค้นหาที่กำหนด
            $isTargetApp = $false
            foreach ($kw in $config.target_app_keywords) {
                if ($appName -like "*$kw*") {
                    $isTargetApp = $true
                    break
                }
            }
            
            # ดึงข้อความจาก Notification visual elements
            $toastBinding = $n.Notification.Visual.GetBinding([Windows.UI.Notifications.KnownNotificationBindings]::ToastGeneric)
            $textList = @()
            if ($toastBinding -ne $null) {
                $elements = $toastBinding.GetTextElements()
                foreach ($el in $elements) {
                    if ($el.Text) { $textList += $el.Text }
                }
            }
            
            $rawMsg = $textList -join " "
            # Auto-repair mojibake if UTF-8 was decoded as Windows-1252
            $fullMessage = $rawMsg
            if ($fullMessage -like "*à¹*" -or $fullMessage -like "*à¸*" -or $fullMessage -like "*Ã*") {
                try {
                    $bytes = [System.Text.Encoding]::GetEncoding(1252).GetBytes($fullMessage)
                    $decoded = [System.Text.Encoding]::UTF8.GetString($bytes)
                    if ($decoded) { $fullMessage = $decoded }
                } catch { }
            }
            
            # ตรวจสอบว่าเป็นข้อความเงินเข้าจาก LINE ของธนาคาร
            $isBankMessage = ($fullMessage -like "*Krungthai*" -or $fullMessage -like "*กรุงไทย*" -or $fullMessage -like "*Connext*" -or
                              $fullMessage -like "*SCB*" -or $fullMessage -like "*ไทยพาณิชย์*" -or
                              $fullMessage -like "*KBank*" -or $fullMessage -like "*กสิกร*" -or $fullMessage -like "*K PLUS*" -or
                              $fullMessage -like "*BBL*" -or $fullMessage -like "*กรุงเทพ*" -or
                              $fullMessage -like "*ttb*" -or $fullMessage -like "*ทีทีบี*" -or
                              $fullMessage -like "*BAY*" -or $fullMessage -like "*Krungsri*" -or $fullMessage -like "*กรุงศรี*" -or
                              $fullMessage -like "*GSB*" -or $fullMessage -like "*ออมสิน*" -or
                              $fullMessage -like "*PromptPay*" -or $fullMessage -like "*พร้อมเพย์*" -or
                              $appName -like "*LINE*" -or $fullMessage -like "*LINE*")

            $hasDeposit = ($fullMessage -like "*เงินเข้า*" -or $fullMessage -like "*รับเงิน*" -or $fullMessage -like "*โอนเข้า*" -or
                           $fullMessage -like "*รับโอน*" -or $fullMessage -like "*โอนสำเร็จ*" -or $fullMessage -like "*ยอดเงิน*" -or
                           $fullMessage -like "*deposit*" -or $fullMessage -like "*received*" -or $isBankMessage)
            $isMoneyOut = ($fullMessage -like "*โอนออก*" -or $fullMessage -like "*ถอนเงิน*" -or $fullMessage -like "*หักบัญชี*" -or $fullMessage -like "*จ่ายบิล*")
            
            if ($hasDeposit -and -not $isMoneyOut) {
                Write-Host "`n--------------------------------------------------" -ForegroundColor Magenta
                Write-Host "[DETECTED] พบการแจ้งเตือนจาก: $appName" -ForegroundColor Yellow
                Write-Host "เวลา: $($n.CreationTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
                Write-Host "ข้อความ: $fullMessage" -ForegroundColor White
                
                # ตรวจสอบธนาคาร
                $detectedBank = "auto"
                if ($fullMessage -like "*Krungthai*" -or $fullMessage -like "*กรุงไทย*" -or $fullMessage -like "*Connext*") { $detectedBank = "krungthai" }
                elseif ($fullMessage -like "*SCB*" -or $fullMessage -like "*ไทยพาณิชย์*") { $detectedBank = "scb" }
                elseif ($fullMessage -like "*KBank*" -or $fullMessage -like "*กสิกร*" -or $fullMessage -like "*K PLUS*") { $detectedBank = "kbank" }
                elseif ($fullMessage -like "*BBL*" -or $fullMessage -like "*กรุงเทพ*") { $detectedBank = "bbl" }
                elseif ($fullMessage -like "*ttb*" -or $fullMessage -like "*ทีทีบี*") { $detectedBank = "ttb" }
                elseif ($fullMessage -like "*Krungsri*" -or $fullMessage -like "*กรุงศรี*" -or $fullMessage -like "*BAY*") { $detectedBank = "krungsri" }
                elseif ($fullMessage -like "*GSB*" -or $fullMessage -like "*ออมสิน*") { $detectedBank = "gsb" }
                elseif ($fullMessage -like "*PromptPay*" -or $fullMessage -like "*พร้อมเพย์*") { $detectedBank = "promptpay" }

                # สกัดจำนวนเงินด้วย Regex
                $amount = $null
                if ($fullMessage -match "(?:เงินเข้า|รับเงิน|โอนเข้า|ยอดเงินเข้า|ได้รับเงิน|รับโอน|โอนสำเร็จ|ยอดเงิน|จำนวน)\s*[:\s]*([0-9,]+(?:\.[0-9]{2})?)\s*(?:บาท|บ\.|THB)?") {
                    $amountStr = $matches[1] -replace ",", ""
                    $amount = [double]$amountStr
                } elseif ($fullMessage -match "([0-9,]+(?:\.[0-9]{2})?)\s*(?:บาท|บ\.|THB)") {
                    $amountStr = $matches[1] -replace ",", ""
                    $amount = [double]$amountStr
                } elseif ($fullMessage -match "฿\s*([0-9,]+(?:\.[0-9]{2})?)") {
                    $amountStr = $matches[1] -replace ",", ""
                    $amount = [double]$amountStr
                } elseif ($fullMessage -match "(?<![-\d])([0-9]{1,6}\.[0-9]{2})(?![-\d])") {
                    $amountStr = $matches[1] -replace ",", ""
                    $amount = [double]$amountStr
                }
                
                if ($amount -and $amount -gt 0) {
                    Write-Host "[PARSER] ธนาคาร: $detectedBank | ยอดเงินที่สกัดได้: " -NoNewline -ForegroundColor Green
                    Write-Host "$amount บาท" -ForegroundColor Yellow
                    
                    # ส่งไปยัง Backend API
                    $payload = @{
                        source = $config.source_name
                        bank = $detectedBank
                        amount = $amount
                        notification_time = $n.CreationTime.ToString("yyyy-MM-ddTHH:mm:sszzz")
                        notification_id = $notifId
                        raw_message = $fullMessage
                    } | ConvertTo-Json
                    
                    Write-Host "[API] กำลังส่งข้อมูลไปยัง $apiUrl..." -ForegroundColor Gray
                    
                    $headers = @{
                        "Content-Type" = "application/json; charset=utf-8"
                        "x-api-key" = $apiKey
                    }
                    
                    try {
                        $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $payload -Headers $headers -TimeoutSec 10
                        
                        if ($response.status -eq "PAID") {
                            Write-Host ">>> [MATCHED & PAID] สำเร็จ! " -ForegroundColor Green -NoNewline
                            Write-Host "บิลห้อง: $($response.room_number) | ผู้เช่า: $($response.tenant_name) | ยอด: $($response.amount) ฿" -ForegroundColor Yellow
                        } elseif ($response.status -eq "duplicate") {
                            Write-Host ">>> [DUPLICATE] รายการนี้ถูกประมวลผลไปแล้ว (ข้าม)" -ForegroundColor Cyan
                        } else {
                            Write-Host ">>> [MANUAL REVIEW] $($response.message)" -ForegroundColor DarkYellow
                        }
                    } catch {
                        Write-Host "[ERROR API] ส่งข้อมูลไม่สำเร็จ: $($_.Exception.Message)" -ForegroundColor Red
                    }
                    
                    SaveProcessedId $notifId
                } else {
                    Write-Host "[PARSER] ไม่พบรูปแบบจำนวนเงินในข้อความนี้ (ข้าม)" -ForegroundColor Gray
                }
                Write-Host "--------------------------------------------------" -ForegroundColor Magenta
            }
        }
    } catch {
        # ละเว้นข้อผิดพลาดชั่วคราวในการอ่าน
    }
    
    Start-Sleep -Seconds $pollInterval
}
