const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

const filterCode = `        pixelRatio: 2,
        quality: 0.95,
        useCORS: true,
        filter: (node) => {
          if (node.tagName === 'LINK' && node.href && node.href.includes('fonts.googleapis.com')) {
            return false;
          }
          return true;
        },`;

code = code.replace(/pixelRatio: 2,\n\s*quality: 0\.95,/g, filterCode);

fs.writeFileSync('src/components/ExportModal.tsx', code);
