# Downloads the missing EmulatorJS core .data files into public/emulatorjs/data/cores
# Run from the project root: powershell -ExecutionPolicy Bypass -File .\get-cores.ps1

$base = "https://cdn.emulatorjs.org/stable/data/cores"
$dest = "public\emulatorjs\data\cores"

$cores = @(
    "mgba",              # GBA
    "melonds",           # NDS
    "gambatte",          # GB / GBC
    "nestopia",          # NES
    "snes9x",            # SNES
    "mupen64plus_next",  # N64
    "genesis_plus_gx",   # Genesis / Mega Drive / Sega CD
    "mednafen_psx_hw",   # PSX
    "pcsx_rearmed",      # PSX (fallback core for browsers without WebGL2)
    "picodrive",         # Sega 32X
    "smsplus",           # Sega Game Gear / Master System
    "yabause",           # Sega Saturn
    "stella2014",        # Atari 2600
    "a5200",             # Atari 5200
    "prosystem",         # Atari 7800
    "handy",             # Atari Lynx
    "virtualjaguar",     # Atari Jaguar
    "mednafen_ngp",      # Neo Geo Pocket (Color)
    "mednafen_wswan",    # WonderSwan (Color)
    "mednafen_pce",      # PC Engine / TurboGrafx-16
    "mednafen_pcfx",     # PC-FX
    "opera",             # 3DO
    "beetle_vb",         # Virtual Boy
    "gearcoleco"         # ColecoVision
)

$variants = @("wasm", "thread-wasm", "legacy-wasm", "thread-legacy-wasm")

New-Item -ItemType Directory -Force -Path $dest | Out-Null

foreach ($core in $cores) {
    foreach ($v in $variants) {
        $file = "$core-$v.data"
        $url = "$base/$file"
        $out = Join-Path $dest $file
        try {
            Write-Host "Downloading $file"
            Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -ErrorAction Stop
        } catch {
            Write-Host "  (skipped - not offered for this core: $file)"
        }
    }
}

# PSP - threaded core only, plus its assets bundle
Write-Host "Downloading ppsspp-thread-wasm.data"
Invoke-WebRequest -Uri "$base/ppsspp-thread-wasm.data" -OutFile (Join-Path $dest "ppsspp-thread-wasm.data") -UseBasicParsing
Write-Host "Downloading ppsspp-assets.zip"
Invoke-WebRequest -Uri "$base/ppsspp-assets.zip" -OutFile (Join-Path $dest "ppsspp-assets.zip") -UseBasicParsing

Write-Host "Downloading cores.json"
Invoke-WebRequest -Uri "$base/cores.json" -OutFile (Join-Path $dest "cores.json") -UseBasicParsing

Write-Host ""
Write-Host "Done. Cores are in $dest"
