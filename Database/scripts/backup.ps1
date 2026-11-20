[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[A-Za-z0-9_]+$')]
    [string] $Database,

    [Parameter(Mandatory)]
    [string] $OutputDirectory,

    [ValidatePattern('^[A-Za-z0-9_-]+$')]
    [string] $LoginPath = 'conectados_backup'
)

$ErrorActionPreference = 'Stop'
$dump = Get-Command mysqldump -CommandType Application
$directory = New-Item -ItemType Directory -Force -Path $OutputDirectory
$timestamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
$baseName = Join-Path $directory.FullName "$Database-$timestamp"
$partial = "$baseName.parcial"
$result = "$baseName.sql"
$arguments = @(
    "--login-path=$LoginPath", '--single-transaction', '--quick',
    '--default-character-set=utf8mb4', '--set-gtid-purged=OFF',
    '--no-tablespaces', "--result-file=$partial", $Database
)
& $dump.Source @arguments
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $partial -PathType Leaf) -or (Get-Item -LiteralPath $partial).Length -eq 0) {
    throw "Backup incompleto. Confira o acesso e o espaço disponível. Arquivo parcial: $partial"
}
Move-Item -LiteralPath $partial -Destination $result
$hash = Get-FileHash -LiteralPath $result -Algorithm SHA256
"$($hash.Hash.ToLowerInvariant())  $([IO.Path]::GetFileName($result))" |
    Set-Content -LiteralPath "$result.sha256" -Encoding Ascii
Write-Output $result
