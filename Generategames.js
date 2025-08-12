const fs = require('fs');
const path = require('path');

// Always scan inside public/roms
const ROMS_DIR = path.join(__dirname, 'public', 'roms');
const OUTPUT_JSON = path.join(__dirname, 'public', 'games.json');

function detectCore(filepath) {
  const ext = path.extname(filepath).toLowerCase();

  switch (ext) {
    case '.gba': return 'gba';
    case '.nds': return 'nds';
    case '.gb':
    case '.gbc': return 'gb';
    case '.nes': return 'nes';
    case '.sfc':
    case '.smc': return 'snes';
    case '.z64': return 'n64';
    case '.md': return 'megadrive';
    case '.iso':
      if (filepath.toLowerCase().includes(`${path.sep}psp${path.sep}`)) {
        return 'psp'; // PSP subfolder
      } else {
        return 'psx'; // Default ISO
      }
    default: return 'unknown';
  }
}

function scanRoms(dir) {
  const files = fs.readdirSync(dir);
  const games = [];

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isFile()) {
      const core = detectCore(fullPath);
      if (core !== 'unknown') {
        games.push({
          name: path.basename(file, path.extname(file)),
          core: core,
          // URL will be relative to public/ for Firebase
          url: 'roms/' + path.relative(ROMS_DIR, fullPath).replace(/\\/g, '/')
        });
      }
    } else if (stat.isDirectory()) {
      games.push(...scanRoms(fullPath));
    }
  });

  return games;
}

if (!fs.existsSync(ROMS_DIR)) {
  console.error(`ROMs directory not found: ${ROMS_DIR}`);
  process.exit(1);
}

const games = scanRoms(ROMS_DIR);
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(games, null, 2), 'utf8');
console.log(`✅ games.json written to ${OUTPUT_JSON} with ${games.length} games.`);
