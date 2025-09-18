# scripts/make-repo-tree.ps1
# One file, two modes:
#   Smart (default): ~500 important files, excludes heavy dirs/noisy files
#   Full:            ALL files (flat list) — like your sample
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File ./scripts/make-repo-tree.ps1          # Smart (default)
#   powershell -ExecutionPolicy Bypass -File ./scripts/make-repo-tree.ps1 -Mode Full  # Full
# You can also run via npm scripts (see Step 2).

param(
  [ValidateSet('Smart','Full')] [string]$Mode = 'Smart',
  [int]$Max = 500
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$OutFile = "repo-tree.txt"
$Root    = (Get-Location).Path

# ---- FULL MODE: make a flat list of ALL files (like your uploaded sample) ----
if ($Mode -eq 'Full') {
  $files = Get-ChildItem -LiteralPath $Root -Force -Recurse -File |
    ForEach-Object {
      $_.FullName.Substring($Root.Length).TrimStart('\','/') -replace '/', '\'
    } |
    Sort-Object -Unique

  Set-Content -LiteralPath $OutFile -Value $files -Encoding UTF8
  Write-Host "Wrote $(Resolve-Path $OutFile) with $($files.Count) files (Full)." -ForegroundColor Green
  exit 0
}

# ---- SMART MODE: ~500 important files only ----
# Keep only these top-level folders (scan only if they exist)
$KeepDirs = @('src','public','scripts','features','functions','core','docs','monitoring','netlify','mho','mho2')

# Keep only these extensions (source/config/docs)
$KeepExt  = @('.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.md','.html','.css','.ps1','.yml','.yaml','.toml')

# Root files to always show if present
$RootFiles = @('package.json','tsconfig.json','tsconfig.node.json','vite.config.ts','vite.config.js','tailwind.config.cjs','postcss.config.cjs','README.md')

# Exclude these directories anywhere in path
$ExDirsRe = '(\\|/)(node_modules|\.git|dist|build|coverage|\.cache|\.turbo|\.vercel|\.next|_trash|tmp|.svelte-kit)(\\|/)'

# Exclude noisy file types/patterns
$ExFilesRe = '(?i)\.(map|min\.js|min\.css|log|lock|png|jpg|jpeg|gif|svg|ico|webp|bmp|pdf|zip|rar)$|(^|[/\\])(__snapshots__|__tests__)[/\\]|\.d\.ts$'

$paths = @()

# Root files first
foreach ($f in $RootFiles) { if (Test-Path -LiteralPath $f) { $paths += $f } }

# Selected folders
$ExistingKeep = $KeepDirs | Where-Object { Test-Path -LiteralPath $_ }
foreach ($d in $ExistingKeep) {
  Get-ChildItem -LiteralPath $d -Recurse -Force -File |
    Where-Object {
      $_.FullName -notmatch $ExDirsRe -and
      ($KeepExt -contains $_.Extension.ToLowerInvariant()) -and
      ($_.FullName -notmatch $ExFilesRe)
    } |
    ForEach-Object {
      $rel = $_.FullName.Substring($Root.Length).TrimStart('\','/') -replace '/', '\'
      $paths += $rel
    }
}

# De-dup + sort (shorter paths first)
$paths = $paths | Sort-Object { $_.Length }, { $_ } -Unique

# Cap to $Max (default 500)
if ($paths.Count -gt $Max) { $paths = $paths[0..($Max-1)] }

# Write as flat list
Set-Content -LiteralPath $OutFile -Value $paths -Encoding UTF8
Write-Host "Wrote $(Resolve-Path $OutFile) with $($paths.Count) files (Smart, cap=$Max)." -ForegroundColor Green
