const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

code = code.replace(/const dataUrl =\n\s*try \{/g, 'let exportResult;\n      try {');

fs.writeFileSync('src/components/ExportModal.tsx', code);
