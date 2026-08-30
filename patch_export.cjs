const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

code = code.replace(
  /const dataUrl = await toPng\(activeSlideRef\.current, \{\n\s*pixelRatio,\n\s*quality: 0\.98,\n\s*cacheBust: true,\n\s*\}\);/g,
  `const dataUrl = await toPng(activeSlideRef.current, {
        pixelRatio,
        quality: 0.98,
        useCORS: true,
      });`
);

code = code.replace(
  /console\.error\('Kunne ikke eksportere bilde:', err\);/g,
  `console.error('Kunne ikke eksportere bilde:', err);
      alert('Det oppstod en feil under eksport (PNG): ' + (err.message || err));`
);

fs.writeFileSync('src/components/ExportModal.tsx', code);
