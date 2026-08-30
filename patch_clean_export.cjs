const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

// 1. Change showInstagramUi={true} to showInstagramUi={false} in the hidden export container
code = code.replace(/showInstagramUi=\{true\}/, 'showInstagramUi={false}');

// 2. Change handleDownloadSingle to use the hidden element
const singleRegex = /const handleDownloadSingle = async \(\) => \{[\s\S]*?if \(onExportSuccess\) onExportSuccess\(\);\n    \} catch \(err: any\) \{[\s\S]*?setIsExportingSingle\(false\);\n    \}\n  \};/m;

const newSingleFunc = `const handleDownloadSingle = async () => {
    const exportSlide = document.getElementById(\`export-slide-\${activeSlideIndex}\`);
    if (!exportSlide) return;
    
    setIsExportingSingle(true);
    try {
      const pixelRatio = resolution === '2160' ? 4 : 2;
      
      const fontLinks = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));
      fontLinks.forEach(link => {
        link.setAttribute('data-href', link.href);
        link.removeAttribute('href');
      });

      let exportResult;
      try {
        exportResult = await toPng(exportSlide, {
          pixelRatio,
          quality: 0.98,
          useCORS: true,
        });
      } finally {
        fontLinks.forEach(link => {
          if (link.getAttribute('data-href')) {
            link.setAttribute('href', link.getAttribute('data-href') || '');
            link.removeAttribute('data-href');
          }
        });
      }

      const link = document.createElement('a');
      link.download = \`slide_\${activeSlideIndex + 1}_\${currentSlide.title?.slice(0, 20).replace(/[^a-z0-9]/gi, '_') || 'eksport'}.png\`;
      link.href = exportResult;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onExportSuccess) onExportSuccess();
    } catch (err: any) {
      console.error('Kunne ikke eksportere:', err);
      alert('Eksport feilet!\\nTeknisk feil: ' + (err?.message || String(err)));
    } finally {
      setIsExportingSingle(false);
    }
  };`;

// We also need to patch handleCopyImage just to be safe
const copyRegex = /const handleCopyImage = async \(\) => \{[\s\S]*?setIsCopyingImage\(false\);\n    \}\n  \};/m;
const newCopyFunc = `const handleCopyImage = async () => {
    const exportSlide = document.getElementById(\`export-slide-\${activeSlideIndex}\`);
    if (!exportSlide) return;

    setIsCopyingImage(true);
    try {
      const pixelRatio = resolution === '2160' ? 4 : 2;

      const fontLinks = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));
      fontLinks.forEach(link => {
        link.setAttribute('data-href', link.href);
        link.removeAttribute('href');
      });

      let blob;
      try {
        blob = await toBlob(exportSlide, {
          pixelRatio,
          quality: 0.98,
          useCORS: true,
        });
      } finally {
        fontLinks.forEach(link => {
          if (link.getAttribute('data-href')) {
            link.setAttribute('href', link.getAttribute('data-href') || '');
            link.removeAttribute('data-href');
          }
        });
      }

      if (!blob) throw new Error('Kunne ikke generere bilde');
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      setCopiedImageSuccess(true);
      setTimeout(() => setCopiedImageSuccess(false), 3000);
    } catch (err: any) {
      console.error('Kopiering feilet:', err);
      alert('Kunne ikke kopiere bildet. Sjekk at nettleseren din støtter utklippstavle-kopiering av bilder.');
    } finally {
      setIsCopyingImage(false);
    }
  };`;

code = code.replace(singleRegex, newSingleFunc);
code = code.replace(copyRegex, newCopyFunc);

fs.writeFileSync('src/components/ExportModal.tsx', code);
