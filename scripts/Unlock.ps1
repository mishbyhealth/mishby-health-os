Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) | Out-Null
Set-Location -Path ..   # go to repo root
Copy-Item "public\_redirects.open" "public\_redirects" -Force
git add public/_redirects
git commit -m "unlock: disable maintenance mode"
git push
Write-Host "✅ Site unlocked (public). Netlify will deploy in ~1–2 minutes."
