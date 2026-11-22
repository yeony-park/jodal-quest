$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot/../..").Path
$out = Join-Path $root 'release'
New-Item -ItemType Directory -Path $out -Force | Out-Null
$bundle = Join-Path ([System.IO.Path]::GetTempPath()) ("jodal-" + [guid]::NewGuid() + ".zip")
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory("$root/dist", $bundle)
    $compiler = "$env:WINDIR/Microsoft.NET/Framework64/v4.0.30319/csc.exe"
    & $compiler /nologo /target:winexe /platform:x64 /optimize+ /codepage:65001 "/out:$out/JodalQuest-Windows-x64.exe" "/resource:$bundle,game.zip" /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll /reference:System.Windows.Forms.dll "$PSScriptRoot/Launcher.cs"
    if ($LASTEXITCODE -ne 0) { throw 'Windows launcher build failed.' }
} finally {
    Remove-Item $bundle -ErrorAction SilentlyContinue
}
