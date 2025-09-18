# scripts/Session-Diff.ps1
param(
  [Parameter(Mandatory=$true)][string]$Start,
  [Parameter(Mandatory=$true)][string]$End,
  [string]$HashStart = ".session-hash-start.json",
  [string]$Out = "session_changes.txt"
)

function Fail($msg){ Write-Error $msg; exit 1 }

if (-not (Test-Path -LiteralPath $Start))     { Fail "Missing $Start. Run Start Snapshot first." }
if (-not (Test-Path -LiteralPath $End))       { Fail "Missing $End. Run End Report (first step) to create it." }
if (-not (Test-Path -LiteralPath $HashStart)) { Fail "Missing $HashStart. Run Start Snapshot first." }

$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
$hash = (Get-Content -Raw -Encoding UTF8 $HashStart | ConvertFrom-Json).hash

# Load trees
$startLines = (Get-Content -Raw -Encoding UTF8 $Start) -split "`r?`n"
$endLines   = (Get-Content -Raw -Encoding UTF8 $End)   -split "`r?`n"

$diff = Compare-Object $startLines $endLines -IncludeEqual:$false

$added   = $diff | Where-Object { $_.SideIndicator -eq '=>' } | ForEach-Object { $_.InputObject }
$removed = $diff | Where-Object { $_.SideIndicator -eq '<=' } | ForEach-Object { $_.InputObject }

$report = @()
$report += "GloWell — Session Diff"
$report += "Time: $ts"
$report += "Start snapshot hash: $hash"
$report += ""
$report += "Added files:"
$report += ($added   | ForEach-Object { "+ $_" })
$report += ""
$report += "Removed files:"
$report += ($removed | ForEach-Object { "- $_" })
$report += ""
$report += "Note: unchanged files are omitted."

$report -join "`r`n" | Set-Content -Encoding UTF8 -NoNewline $Out
Write-Host "Wrote $Out"
