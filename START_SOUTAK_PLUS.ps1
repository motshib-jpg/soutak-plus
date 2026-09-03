$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$port = 8080
$url = "http://127.0.0.1:$port/index.html"

function Test-PortInUse {
    param([int]$Port)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect("127.0.0.1", $Port)
        $client.Close()
        return $true
    } catch { return $false }
}

if (Test-PortInUse -Port $port) {
    Start-Process $url
    exit
}

$python = $null
foreach ($candidate in @("py", "python", "python3")) {
    try {
        & $candidate --version *> $null
        if ($LASTEXITCODE -eq 0) { $python = $candidate; break }
    } catch {}
}

if (-not $python) {
    Write-Host "لم يتم العثور على Python. سيتم فتح index.html مباشرة." -ForegroundColor Yellow
    Start-Process (Join-Path $PSScriptRoot "index.html")
    exit
}

Write-Host "تشغيل صوتك+ محلياً على $url" -ForegroundColor Green
Start-Process $url
& $python -m http.server $port --bind 127.0.0.1
