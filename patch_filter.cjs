const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

const filterCode = `        pixelRatio,
        quality: 0.98,
        useCORS: true,
        filter: (node) => {
          if (node.tagName === 'LINK' && node.href && node.href.includes('fonts.googleapis.com')) {
            return false;
          }
          return true;
        },`;

code = code.replace(/pixelRatio,\n\s*quality: 0\.98,\n\s*useCORS: true,/g, filterCode);

fs.writeFileSync('src/components/ExportModal.tsx', code);
