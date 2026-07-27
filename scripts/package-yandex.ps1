$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$bundledNode = "C:\Users\samk1\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$node = if ($nodeCommand) { $nodeCommand.Source } elseif (Test-Path $bundledNode) { $bundledNode } else { throw "Node.js was not found." }
$vite = Join-Path $workspace "node_modules\vite\bin\vite.js"
$dist = Join-Path $workspace "yandex-dist"
$release = Join-Path $workspace "yandex-release"
$archive = Join-Path $release "pickaxe-drop-yandex.zip"

& $node $vite build --config (Join-Path $workspace "vite.yandex.config.ts")
if ($LASTEXITCODE -ne 0) { throw "Yandex build failed." }

& $node (Join-Path $workspace "scripts\validate-yandex-build.mjs")
if ($LASTEXITCODE -ne 0) { throw "Yandex build validation failed." }

New-Item -ItemType Directory -Force -Path $release | Out-Null
Compress-Archive -Path (Join-Path $dist "*") -DestinationPath $archive -CompressionLevel Optimal -Force

Write-Host "Yandex release archive: $archive"
