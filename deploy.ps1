param(
  [Parameter(Mandatory = $true)][string]$Token,
  [string]$Owner = "xiaobai-miao1145",
  [string]$Repo = "stronghold-protocol"
)

$ErrorActionPreference = "Stop"
$py = "C:\Users\bai\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
$api = "D:\projects\_build\gh_api.py"
$env:GH_TOKEN = $Token
$env:GIT_TERMINAL_PROMPT = "0"

Write-Host "1/3 创建仓库 $Owner/$Repo ..."
& $py -X utf8 $api POST /user/repos (@{
  name        = $Repo
  description = "Arknights Stronghold Protocol (Nov 2026) — all 26 covenants and 143 operators, offline single-file cheat sheet"
  homepage    = "https://$Owner.github.io/$Repo/"
  private     = $false
  has_wiki    = $false
} | ConvertTo-Json -Compress)

Write-Host "2/3 推送 index.html ..."
$credFile = Join-Path $env:TEMP ("ghcred_" + [guid]::NewGuid().ToString("N") + ".txt")
"protocol=https`nhost=github.com`nusername=$Owner`npassword=$Token`n" |
  git -c credential.helper="store --file=$credFile" credential approve
try {
  Push-Location $PSScriptRoot
  git init -b main 2>$null | Out-Null
  git add -A
  git -c user.name="$Owner" -c user.email="$Owner@users.noreply.github.com" commit -m "Deploy Stronghold Protocol cheat sheet" 2>$null | Out-Null
  git remote remove origin 2>$null
  git remote add origin "https://github.com/$Owner/$Repo.git"
  git -c credential.helper="store --file=$credFile" push -u origin main
} finally {
  Pop-Location
  Remove-Item $credFile -Force -ErrorAction SilentlyContinue
}

Write-Host "3/3 开启 GitHub Pages ..."
& $py -X utf8 $api POST "/repos/$Owner/$Repo/pages" '{"source":{"branch":"main","path":"/"}}'
Start-Sleep -Seconds 3
& $py -X utf8 $api GET "/repos/$Owner/$Repo/pages"

Write-Host ""
Write-Host "完成。Pages 首次构建约需 30-60 秒：" -ForegroundColor Green
Write-Host "  https://$Owner.github.io/$Repo/" -ForegroundColor Cyan
