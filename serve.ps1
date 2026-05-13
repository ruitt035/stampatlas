param(
  [int]$Port = 5173
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Get-ContentType([string]$Path) {
  $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
  switch ($ext) {
    ".html" { "text/html; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".js" { "text/javascript; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".png" { "image/png" }
    ".jpg" { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".gif" { "image/gif" }
    ".svg" { "image/svg+xml" }
    ".webp" { "image/webp" }
    ".woff" { "font/woff" }
    ".woff2" { "font/woff2" }
    default { "application/octet-stream" }
  }
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

$url = "http://127.0.0.1:$Port/"
Write-Host "Serving $Root at $url"

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
    $requestLine = $reader.ReadLine()
    if (-not $requestLine) { continue }
    $parts = $requestLine.Split(" ")
    $method = $parts[0]
    $rawPath = $parts[1]
    while ($true) {
      $line = $reader.ReadLine()
      if ($null -eq $line -or $line -eq "") { break }
    }

    if ($method -ne "GET") {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Method Not Allowed")
      $hdr = "HTTP/1.1 405 Method Not Allowed`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $stream.Write([System.Text.Encoding]::ASCII.GetBytes($hdr), 0, $hdr.Length)
      $stream.Write($body, 0, $body.Length)
      continue
    }

    $path = [System.Uri]::UnescapeDataString($rawPath.Split("?")[0])
    if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }
    $safe = $path.TrimStart("/").Replace("/", "\")
    $filePath = Join-Path $Root $safe

    if (-not (Test-Path $filePath -PathType Leaf)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
      $hdr = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $hbytes = [System.Text.Encoding]::ASCII.GetBytes($hdr)
      $stream.Write($hbytes, 0, $hbytes.Length)
      $stream.Write($body, 0, $body.Length)
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $ctype = Get-ContentType $filePath
    $hdr = "HTTP/1.1 200 OK`r`nContent-Type: $ctype`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
    $hbytes = [System.Text.Encoding]::ASCII.GetBytes($hdr)
    $stream.Write($hbytes, 0, $hbytes.Length)
    $stream.Write($bytes, 0, $bytes.Length)
  } catch {
  } finally {
    $client.Close()
  }
}

