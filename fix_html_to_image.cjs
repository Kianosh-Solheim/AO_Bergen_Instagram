const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

// Replace toPng options to include cacheBust
code = code.replace(/pixelRatio,\s*quality: 0\.98,\s*useCORS: true,/g, 'pixelRatio, quality: 0.98, useCORS: true, cacheBust: true,');

fs.writeFileSync('src/components/ExportModal.tsx', code);
