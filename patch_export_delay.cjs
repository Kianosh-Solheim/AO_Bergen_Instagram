const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

code = code.replace(/setIsExportingAll\(true\);\n    try \{/, 'setIsExportingAll(true);\n    await new Promise(r => setTimeout(r, 500));\n    try {');

fs.writeFileSync('src/components/ExportModal.tsx', code);
