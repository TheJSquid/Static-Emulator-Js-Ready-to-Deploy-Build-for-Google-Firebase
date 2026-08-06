const fs = require('fs');
const path = require('path');

const ROMS_DIR = path.join(__dirname, 'public', 'roms');
const OUTPUT_JSON = path.join(__dirname, 'public', 'games.json');

// Companion/data files that are referenced BY a primary file (like a .cue
// pointing at a .bin) and should never be listed as their own game entry,
// even when they sit inside a folder from FOLDER_CORE_MAP above.
const COMPANION_EXTS = new Set(['.bin', '.sub', '.toc', '.ccd', '.img']);

// Folders whose NAME determines the core directly - use these for any system
// whose ROM extension is ambiguous with another system (disc-based formats
// like .iso/.cue/.chd, and .bin which several older cartridge systems share).
// Put matching ROMs in public/roms/<folder>/ (any nesting depth is fine).
const FOLDER_CORE_MAP = {
  psp: 'psp',
  psx: 'psx',
  segacd: 'segaCD',
  saturn: 'segaSaturn',
  '3do': '3do',
  atari2600: 'atari2600',
  atari5200: 'atari5200',
};

// Extensions that unambiguously identify a system regardless of folder.
const EXT_CORE_MAP = {
  // Nintendo
  '.nes': 'nes',
  '.fds': 'nes',
  '.sfc': 'snes',
  '.smc': 'snes',
  '.z64': 'n64',
  '.n64': 'n64',
  '.v64': 'n64',
  '.gb': 'gb',
  '.gbc': 'gb',
  '.gba': 'gba',
  '.nds': 'nds',
  // Sega
  '.md': 'segaMD',
  '.gen': 'segaMD',
  '.smd': 'segaMD',
  '.32x': 'sega32x',
  '.gg': 'segaGG',
  '.sms': 'segaMS',
  // Atari
  '.a26': 'atari2600',
  '.a52': 'atari5200',
  '.a78': 'atari7800',
  '.lnx': 'lynx',
  '.jag': 'jaguar',
  '.j64': 'jaguar',
  // Other handhelds
  '.ngp': 'ngp',
  '.ngc': 'ngp',
  '.ws': 'ws',
  '.wsc': 'ws',
  '.vb': 'vb',
  // NEC
  '.pce': 'pce',
  '.pcfx': 'pcfx',
  // Other
  '.col': 'coleco',
  '.cv': 'coleco',
};

function detectCore(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  if (COMPANION_EXTS.has(ext)) return 'unknown';

  const parts = filepath.toLowerCase().split(path.sep);
  for (const part of parts) {
    if (FOLDER_CORE_MAP[part]) return FOLDER_CORE_MAP[part];
  }

  if (EXT_CORE_MAP[ext]) return EXT_CORE_MAP[ext];

  // .iso/.cso without a recognized folder default to PSP; ambiguous disc
  // formats (.iso/.cue/.chd/.pbp/.m3u) without a recognized folder default to PSX.
  if (ext === '.cso') return 'psp';
  if (ext === '.iso' || ext === '.chd' || ext === '.cue' || ext === '.pbp' || ext === '.m3u') return 'psx';

  return 'unknown';
}

function scanRoms(dir, baseDir = ROMS_DIR) {
  let games = [];
  let skipped = [];
  const entries = fs.readdirSync(dir);
  const files = entries.filter(f => fs.statSync(path.join(dir, f)).isFile());
  const dirs = entries.filter(f => fs.statSync(path.join(dir, f)).isDirectory());

  dirs.forEach(d => {
    const sub = scanRoms(path.join(dir, d), baseDir);
    games = games.concat(sub.games);
    skipped = skipped.concat(sub.skipped);
  });

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const ext = path.extname(file).toLowerCase();
    const core = detectCore(fullPath);

    if (core === 'unknown') {
      skipped.push(path.relative(baseDir, fullPath));
      return;
    }

    // .cue files sometimes fail to load directly in-browser even though the
    // matching .bin loads fine on its own. Keep the clean .cue-derived name,
    // but point the actual load URL at the sibling .bin if one exists.
    let loadPath = fullPath;
    if (ext === '.cue') {
      const baseName = path.basename(file, ext).toLowerCase();
      const matchingBin = files.find(f =>
        path.extname(f).toLowerCase() === '.bin' &&
        path.basename(f, path.extname(f)).toLowerCase() === baseName
      );
      if (matchingBin) {
        loadPath = path.join(dir, matchingBin);
      }
    }

    games.push({
      name: path.basename(fullPath, ext),
      core: core,
      url: 'roms/' + path.relative(baseDir, loadPath).replace(/\\/g, '/')
    });
  });

  return { games, skipped };
}

const { games, skipped } = scanRoms(ROMS_DIR);
games.sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(games, null, 2));
console.log(`✅ games.json written with ${games.length} games.`);
if (skipped.length) {
  console.log(`⚠️  ${skipped.length} file(s) not recognized:`);
  skipped.forEach(f => console.log(`   - ${f}`));
}
