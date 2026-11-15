param(
  [Parameter(Mandatory = $true)][string]$Token,
  [string]$Owner = "0b1ivionis",
  [string]$Repo = "stronghold-protocol"
)

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false) } catch {}
$py = "C:\Users\bai\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
$api = "D:\projects\_build\gh_api.py"
$env:GH_TOKEN = $Token

function Invoke-Api([string]$method, [string]$path, $payload) {
  if ($null -eq $payload) {
    $out = & $py -X utf8 $api $method $path 2>&1
  } else {
    $tmp = Join-Path $env:TEMP ("ghpayload_" + [guid]::NewGuid().ToString("N") + ".json")
    [IO.File]::WriteAllText($tmp, ($payload | ConvertTo-Json -Compress), [Text.UTF8Encoding]::new($false))
    try { $out = & $py -X utf8 $api $method $path "@$tmp" 2>&1 } finally { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
  }
  $out | ForEach-Object { Write-Host "   $_" }
  $statusLine = ($out | Where-Object { $_ -match "^STATUS (\d+)$" } | Select-Object -First 1)
  if ($statusLine -match "^STATUS (\d+)$") { return [int]$Matches[1] }
  return -1
}

Write-Host "1/3 create repo $Owner/$Repo"
$status = Invoke-Api POST /user/repos @{
  name        = $Repo
  description = "Arknights Stronghold Protocol (Nov 2026): 26 covenants, 143 operators, offline single-file cheat sheet"
  homepage    = "https://$Owner.github.io/$Repo/"
  private     = $false
  has_wiki    = $false
}
if ($status -ne 201 -and $status -ne 422) { throw "repo creation failed (status $status)" }
if ($status -eq 422) { Write-Host "   repo already exists, continue" }

Write-Host "2/3 push files"
Push-Location $PSScriptRoot
try {
  if (-not (Test-Path ".git")) { git init -b main | Out-Null }
  git add -A
  git -c user.name=$Owner -c user.email="$Owner@users.noreply.github.com" commit -m "Deploy Stronghold Protocol cheat sheet" 2>$null | Out-Null
  $existing = git remote get-url origin 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $existing) {
    git remote add origin "https://github.com/$Owner/$Repo.git"
  }
  $authUrl = "https://x-access-token:$Token@github.com/$Owner/$Repo.git"
  git push $authUrl "HEAD:main" --force
  if ($LASTEXITCODE -ne 0) { throw "push failed" }
  git remote set-url origin "https://github.com/$Owner/$Repo.git"
} finally { Pop-Location }

Write-Host "3/3 enable GitHub Pages"
$status = Invoke-Api POST "/repos/$Owner/$Repo/pages" @{ source = @{ branch = "main"; path = "/" } }
if ($status -ne 201 -and $status -ne 409) { Write-Host "   pages API returned $status (may already be enabled)" }
Start-Sleep -Seconds 3
Invoke-Api GET "/repos/$Owner/$Repo/pages" $null | Out-Null

Write-Host ""
Write-Host "Done. Pages build usually takes 30-60s:"
Write-Host "  https://$Owner.github.io/$Repo/" -ForegroundColor Cyan
