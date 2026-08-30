const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

const withFontFix = (originalBlock) => {
  return `
      // Fjern midlertidig Google Fonts lenke for å stoppe CSSRules advarsel og potensielle kræsj
      const fontLinks = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));
      fontLinks.forEach(link => {
        link.setAttribute('data-href', link.href);
        link.removeAttribute('href');
      });

      ${originalBlock}

      // Gjenopprett lenken
      fontLinks.forEach(link => {
        if (link.getAttribute('data-href')) {
          link.setAttribute('href', link.getAttribute('data-href'));
          link.removeAttribute('data-href');
        }
      });
`;
}

// 1. handleExportPng
const pngBlock = `const dataUrl = await toPng(activeSlideRef.current, {
        pixelRatio,
        quality: 0.98,
        useCORS: true,
        filter: (node) => {
          if (node.tagName === 'LINK' && node.href && node.href.includes('fonts.googleapis.com')) {
            return false;
          }
          return true;
        },
      });`;
code = code.replace(pngBlock, withFontFix(pngBlock));

// 2. handleCopyImage
const blobBlock = `const blob = await toBlob(activeSlideRef.current, {
        pixelRatio: 2,
        quality: 0.95,
        useCORS: true,
        filter: (node) => {
          if (node.tagName === 'LINK' && node.href && node.href.includes('fonts.googleapis.com')) {
            return false;
          }
          return true;
        },
      });`;
code = code.replace(blobBlock, withFontFix(blobBlock));

// 3. handleDownloadAllZip
const zipBlock = `const currentDataUrl = await toPng(activeSlideRef.current, {
        pixelRatio,
        quality: 0.98,
        useCORS: true,
        filter: (node) => {
          if (node.tagName === 'LINK' && node.href && node.href.includes('fonts.googleapis.com')) {
            return false;
          }
          return true;
        },
      });`;
// Replace the exact matching block
code = code.replace(zipBlock, withFontFix(zipBlock));


fs.writeFileSync('src/components/ExportModal.tsx', code);
