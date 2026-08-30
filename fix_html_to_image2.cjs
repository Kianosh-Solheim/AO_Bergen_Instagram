const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

// Replace duplicate cacheBust
code = code.replace(/cacheBust: true, cacheBust: true,/g, 'cacheBust: true,');

fs.writeFileSync('src/components/ExportModal.tsx', code);
