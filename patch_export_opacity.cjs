const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

code = code.replace(/<div style=\{\{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' \}\}>/, 
    "<div style={{ position: 'fixed', left: '-10000px', top: '-10000px', pointerEvents: 'none' }}>");

fs.writeFileSync('src/components/ExportModal.tsx', code);
