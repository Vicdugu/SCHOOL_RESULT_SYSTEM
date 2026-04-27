# Push to GitHub with authentication
# This script will help you push your code to GitHub

Write-Host "🚀 School Result System - GitHub Push Helper" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

$gitPath = "C:\Program Files\Git\cmd\git.exe"

# Change to project directory
cd "c:\Users\vicdu\OneDrive\Desktop\Projects\School result system"

Write-Host "📋 Current Status:" -ForegroundColor Yellow
& $gitPath status --short

Write-Host ""
Write-Host "🔑 To authenticate with GitHub, you have two options:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Use Personal Access Token (Recommended)" -ForegroundColor Green
Write-Host "  1. Go to: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "  2. Click 'Generate new token (classic)'" -ForegroundColor White
Write-Host "  3. Select scopes: repo, write:repo_hook" -ForegroundColor White
Write-Host "  4. Copy the token" -ForegroundColor White
Write-Host "  5. Run: git push -u origin master" -ForegroundColor White
Write-Host "  6. Use your username and token as password" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Use SSH Key" -ForegroundColor Green
Write-Host "  1. Set up SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh" -ForegroundColor White
Write-Host "  2. Run: git remote set-url origin git@github.com:Vicdugu/SCHOOL_RESULT_SYSTEM.git" -ForegroundColor White
Write-Host "  3. Run: git push -u origin master" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Repository URL:" -ForegroundColor Yellow
& $gitPath remote -v

Write-Host ""
Write-Host "Ready to push? Run this command:" -ForegroundColor Cyan
Write-Host "  & 'C:\Program Files\Git\cmd\git.exe' push -u origin master" -ForegroundColor White
Write-Host ""
