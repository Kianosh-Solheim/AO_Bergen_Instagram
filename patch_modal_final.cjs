const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

// First, strip out the old filter code completely to normalize it
code = code.replace(/filter: \(node\) => \{[\s\S]*?\},/g, '');

// Helper to wrap html-to-image calls
const wrapper = (innerCode) => {
  return `
      // Fjern midlertidig Google Fonts lenke for å unngå CORS-krasj i html-to-image
      const fontLinks = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));
      fontLinks.forEach(link => {
        link.setAttribute('data-href', link.href);
        link.removeAttribute('href');
      });

      let exportResult;
      try {
        exportResult = await ${innerCode};
      } finally {
        // Gjenopprett lenken
        fontLinks.forEach(link => {
          if (link.getAttribute('data-href')) {
            link.setAttribute('href', link.getAttribute('data-href'));
            link.removeAttribute('data-href');
          }
        });
      }
`;
};

// 1. handleDownloadImage
code = code.replace(
  /const dataUrl = await toPng\(activeSlideRef\.current, \{\s*pixelRatio,\s*quality: 0\.98,\s*useCORS: true,\s*\}\);/g,
  wrapper(`toPng(activeSlideRef.current, {
          pixelRatio,
          quality: 0.98,
          useCORS: true,
        })`).replace('let exportResult;', 'const dataUrl =') + '\nconst dataUrl = exportResult;' // A bit hacky but works since we declare dataUrl below
);

fs.writeFileSync('src/components/ExportModal.tsx', code);
