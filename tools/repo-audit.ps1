# tools/repo-audit.ps1
# Mishby Health OS — Repo Map & Path Audit (ASCII-safe)

param(
  [string]$Root = (Get-Location).Path
)

function Section($title) {
  Write-Host ""
  Write-Host ("=== {0} ===" -f $title)
}

function Status($ok, $msg) {
  if ($ok) {
    Write-Host ("OK  - {0}" -f $msg) -ForegroundColor Green
  } else {
    Write-Host ("FAIL- {0}" -f $msg) -ForegroundColor Red
  }
}

# ---------------- Main ----------------
Set-Location $Root

Section "Target Root"
Write-Host $Root

# ---- Required paths (from your canonical map) ----
$required = @(
  "mho\form\healthForm.schema.json",
  "mho\engine\index.ts",
  "mho\engine\processForm.ts",
  "src\pages\HealthForm.tsx",
  "src\pages\PlanView.tsx",
  "src\components\forms\HealthFormStepper.tsx",
  "src\components\plan\PlanCard.tsx",
  "src\utils\validators.ts",
  "src\utils\export\pdfHelper.ts",
  "src\utils\export\excelHelper.ts",
  "public\manifest.json",
  "public\logo.png",
  "public\logo192.png",
  "public\logo512.png",
  "public\apple-touch-icon.png",
  "public\favicon.ico"
)

Section "Required Paths"
$missing = @()
foreach ($p in $required) {
  $exists = Test-Path -Path $p
  Status $exists $p
  if (-not $exists) { $missing += $p }
}

# ---- Duplicate file check (common culprits) ----
Section "Duplicate Components Check"
$filesToCheck = @("HealthFormStepper.tsx", "PlanCard.tsx")
foreach ($fname in $filesToCheck) {
  $matches = Get-ChildItem -Recurse -Include $fname -File -ErrorAction SilentlyContinue
  if ($matches.Count -gt 1) {
    Write-Host ("DUPL- {0} has {1} copies" -f $fname, $matches.Count) -ForegroundColor Yellow
    foreach ($m in $matches) {
      Write-Host ("      - {0}" -f $m.FullName)
    }
  } elseif ($matches.Count -eq 1) {
    Status $true ("{0} found once: {1}" -f $fname, $matches[0].FullName)
  } else {
    Status $false ("{0} not found" -f $fname)
  }
}

# ---- Search for wrong imports (old path) ----
Section "Search for old imports: mho/planner/"
$codeFiles = Get-ChildItem -Recurse -Include *.ts,*.tsx -File -ErrorAction SilentlyContinue
$wrongImports = $codeFiles | Select-String -Pattern 'mho/planner/' -SimpleMatch
if ($wrongImports) {
  Write-Host "FOUND old imports that must be fixed:"
  foreach ($hit in $wrongImports) {
    Write-Host ("  - {0}:{1}  {2}" -f $hit.Path, $hit.LineNumber, $hit.Line.Trim())
  }
} else {
  Write-Host "OK  - No old mho/planner/ imports found."
}

# ---- Check for public/mho (should not be used) ----
Section "Check for public/mho folder"
$publicMhoPath = "public\mho"
if (Test-Path -Path $publicMhoPath) {
  Write-Host ("WARN- Found {0}. Move backups to _archive to keep them out of build." -f $publicMhoPath) -ForegroundColor Yellow
} else {
  Write-Host "OK  - No public\mho folder."
}

# ---- Verify 'mho' alias mention in vite.config.ts ----
Section "vite.config.ts alias mention check"
$viteFile = "vite.config.ts"
if (Test-Path $viteFile) {
  $viteContent = Get-Content $viteFile -Raw
  if ($viteContent -match "mho") {
    Status $true "Found 'mho' mentioned in vite.config.ts"
  } else {
    Status $false "No 'mho' mention found in vite.config.ts"
  }
} else {
  Status $false "vite.config.ts not found"
}

# ---- Summary ----
Section "Summary"
if ($missing.Count -eq 0) {
  Write-Host "OK  - All required paths are present." -ForegroundColor Green
} else {
  Write-Host "FAIL- Missing paths:" -ForegroundColor Red
  foreach ($m in $missing) { Write-Host ("      - {0}" -f $m) }
}

Write-Host ""
Write-Host "Next: If everything is OK, reply: Repo map locked"
