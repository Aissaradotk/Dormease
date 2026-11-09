[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

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

[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null

$ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $ocrEngine) {
    $langs = [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages
    if ($langs -and $langs.Count -gt 0) {
        $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($langs[0])
    }
}

[Console]::Out.WriteLine("---OCR_WORKER_READY---")
[Console]::Out.Flush()

while ($true) {
    $imgPath = [Console]::In.ReadLine()
    if ($null -eq $imgPath) { break }
    $imgPath = $imgPath.Trim()
    if ([string]::IsNullOrWhiteSpace($imgPath)) { continue }

    if (-not (Test-Path $imgPath)) {
        [Console]::Out.WriteLine("---END_OCR---")
        [Console]::Out.Flush()
        continue
    }

    try {
        $fullPath = (Resolve-Path $imgPath).Path
        $imgFile = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($fullPath)) ([Windows.Storage.StorageFile])
        $stream = Await ($imgFile.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
        $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $softwareBitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

        if ($ocrEngine) {
            $ocrResult = Await ($ocrEngine.RecognizeAsync($softwareBitmap)) ([Windows.Media.Ocr.OcrResult])
            $cleanText = ($ocrResult.Text -replace "`r", " ") -replace "`n", " "
            [Console]::Out.WriteLine($cleanText)
        } else {
            [Console]::Out.WriteLine("")
        }
    } catch {
        [Console]::Out.WriteLine("")
    }

    [Console]::Out.WriteLine("---END_OCR---")
    [Console]::Out.Flush()
}
