const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

code = code.replace(
  /const currentDataUrl = await toPng\(activeSlideRef\.current, \{\n\s*pixelRatio,\n\s*quality: 0\.98,\n\s*\}\);/g,
  `const currentDataUrl = await toPng(activeSlideRef.current, {
        pixelRatio,
        quality: 0.98,
        useCORS: true,
      });`
);

code = code.replace(
  /console\.error\('Kunne ikke lage ZIP:', err\);/g,
  `console.error('Kunne ikke lage ZIP:', err);
      alert('Det oppstod en feil under eksport (ZIP): ' + (err.message || err));`
);

fs.writeFileSync('src/components/ExportModal.tsx', code);
