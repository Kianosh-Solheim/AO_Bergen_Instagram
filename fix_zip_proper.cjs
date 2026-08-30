const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

const regex = /const handleDownloadAllZip = async \(\) => \{[\s\S]*?if \(onExportSuccess\) onExportSuccess\(\);\n    \}\n  \};/m;

const match = regex.exec(code);

if (match) {
  const newFunc = `const handleDownloadAllZip = async () => {
    setIsExportingAll(true);
    try {
      const zip = new JSZip();
      const pixelRatio = resolution === '2160' ? 4 : 2;
      
      // Remove Google fonts link temporarily to avoid html-to-image cssRules CORS crash
      const fontLinks = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));
      fontLinks.forEach(link => {
        link.setAttribute('data-href', link.href);
        link.removeAttribute('href');
      });

      for (let i = 0; i < project.slides.length; i++) {
        const slideElement = document.getElementById(\`export-slide-\${i}\`);
        if (!slideElement) continue;

        const currentDataUrl = await toPng(slideElement, {
          pixelRatio,
          quality: 0.98,
          useCORS: true,
        });

        const base64Data = currentDataUrl.split(',')[1];
        const currentSlide = project.slides[i];
        const fileName = \`slide_\${String(i + 1).padStart(2, '0')}_\${(
          currentSlide.title || currentSlide.preset
        )
          .slice(0, 20)
          .replace(/[^a-z0-9]/gi, '_')}.png\`;
        
        zip.file(fileName, base64Data, { base64: true });
      }

      // Restore links
      fontLinks.forEach(link => {
        link.setAttribute('href', link.getAttribute('data-href') || '');
      });

      // Add text caption file
      const captionText = \`\${project.caption}\\n\\n\${project.hashtags}\`;
      zip.file('instagram_caption.txt', captionText);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = \`\${project.title.replace(/[^a-z0-9]/gi, '_')}_instagram_export.zip\`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onExportSuccess) {
        onExportSuccess();
      }
    } catch (err: any) {
      console.error('Kunne ikke lage ZIP:', err);
      let errMsg = err?.message || String(err);
      if (err instanceof Event) {
        errMsg = "CORS-blokkering eller nettverksfeil ved nedlasting av bilde (Event)";
      }
      alert('Eksport feilet (ZIP)!\\n\\nDette skjer ofte pga beskyttede bilder.\\nTeknisk feil: ' + errMsg);
    } finally {
      setIsExportingAll(false);
    }
  };`;

  code = code.replace(regex, newFunc);
  fs.writeFileSync('src/components/ExportModal.tsx', code);
  console.log('Successfully patched zip function');
} else {
  console.log('Could not match zip function with regex.');
}
