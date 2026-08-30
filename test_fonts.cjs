const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

const replaceCode = `
      // Remove Google fonts link temporarily to avoid html-to-image cssRules CORS crash
      const fontLinks = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));
      fontLinks.forEach(link => {
        link.setAttribute('data-href', link.href);
        link.removeAttribute('href');
      });

      // Capture currently mounted slide
      const currentDataUrl = await toPng(activeSlideRef.current, {
        pixelRatio,
        quality: 0.98,
        useCORS: true,
      });
      
      // Restore links
      fontLinks.forEach(link => {
        link.setAttribute('href', link.getAttribute('data-href'));
      });
`;

code = code.replace(/\/\/ Capture currently mounted slide[\s\S]*?\}\);/m, replaceCode);

fs.writeFileSync('src/components/ExportModal.tsx', code);
