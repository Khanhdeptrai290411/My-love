const fs = require('fs');
const path = require('path');
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes("import HeartLoader") && !c.includes('<HeartLoader')) {
        fs.writeFileSync(p, c.replace(/import HeartLoader from '@\/components\/HeartLoader'\n/, ''));
        console.log('Cleaned', p);
      }
    }
  }
}
walk('./app');
