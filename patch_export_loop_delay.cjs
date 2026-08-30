const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

code = code.replace(/zip\.file\(fileName, base64Data, \{ base64: true \}\);/g, 
    'zip.file(fileName, base64Data, { base64: true });\n        await new Promise(r => setTimeout(r, 100));');

fs.writeFileSync('src/components/ExportModal.tsx', code);
