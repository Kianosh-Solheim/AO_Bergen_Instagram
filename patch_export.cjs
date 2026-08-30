const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

// Add import
code = code.replace(/import \{ Slide, CarouselProject \} from '\.\.\/types';/, "import { Slide, CarouselProject } from '../types';\nimport { CanvasSlide } from './CanvasSlide';");

// Locate handleDownloadAllZip
const zipRegex = /const handleDownloadAllZip = async \(\) => \{[\s\S]*?setIsExportingAll\(false\);\n    \}\n  \};/;
const newZipFunc = `
  const handleDownloadAllZip = async () => {
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
    } catch (error) {
      console.error('Failed to zip:', error);
      alert('En feil oppstod under generering av ZIP-filen. Prøv igjen.');
    } finally {
      setIsExportingAll(false);
    }
  };
`;

code = code.replace(zipRegex, newZipFunc.trim());

// Add the hidden slides container inside the component, just before the return statement.
// But we can just put it at the end of the returned JSX.
const jsxReturnSplit = code.lastIndexOf('</div>');
const hiddenContainer = `
        {/* Hidden container to render all slides for Export */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
          {project.slides.map((slide, index) => (
            <div key={slide.id} id={\`export-slide-\${index}\`} style={{ width: '540px', height: '675px' }}>
              <CanvasSlide
                slide={slide}
                showPurpleGuide={false}
                showInstagramUi={true}
                instagramHandle={project.instagramHandle}
                instagramLocation={project.instagramLocation}
                scale={1}
                interactive={false}
              />
            </div>
          ))}
        </div>
`;

code = code.slice(0, jsxReturnSplit) + hiddenContainer + code.slice(jsxReturnSplit);

fs.writeFileSync('src/components/ExportModal.tsx', code);
