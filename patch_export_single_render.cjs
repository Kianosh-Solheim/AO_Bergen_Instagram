const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

// Add exportRenderIndex state
code = code.replace(
  /const \[isExportingAll, setIsExportingAll\] = useState\(false\);/,
  'const [isExportingAll, setIsExportingAll] = useState(false);\n  const [exportRenderIndex, setExportRenderIndex] = useState<number | null>(null);'
);

// Update handleDownloadAllZip to use setExportRenderIndex and wait
code = code.replace(
  /for \(let i = 0; i < project\.slides\.length; i\+\+\) \{/,
  'for (let i = 0; i < project.slides.length; i++) {\n        setExportRenderIndex(i);\n        await new Promise(r => setTimeout(r, 400));'
);

code = code.replace(
  /const zipBlob = await zip\.generateAsync/,
  'setExportRenderIndex(null);\n      const zipBlob = await zip.generateAsync'
);

// Catch block reset
code = code.replace(
  /setIsExportingAll\(false\);/,
  'setIsExportingAll(false);\n      setExportRenderIndex(null);'
);

// Update render block to only render the active slide or exportRenderIndex
const renderBlock = `<div style={{ position: 'fixed', left: '-10000px', top: '-10000px', pointerEvents: 'none' }}>
          {project.slides.map((slide, index) => {
            // Unmount slides we aren't currently exporting/viewing to avoid html-to-image cache collisions
            const shouldRender = isExportingAll 
              ? exportRenderIndex === index 
              : activeSlideIndex === index;
              
            if (!shouldRender) return null;
            
            return (
              <div key={slide.id} id={\`export-slide-\${index}\`} style={{ width: '540px', height: '675px' }}>
                <CanvasSlide
                  slide={slide}
                  showPurpleGuide={false}
                  showInstagramUi={false}
                  instagramHandle={project.instagramHandle}
                  instagramLocation={project.instagramLocation}
                  scale={1}
                  interactive={false}
                />
              </div>
            );
          })}
        </div>`;

code = code.replace(
  /<div style=\{\{ position: 'fixed', left: '-10000px', top: '-10000px', pointerEvents: 'none' \}\}>[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/,
  renderBlock + '\n        </div>\n      </div>\n    </div>\n  </div>'
);

fs.writeFileSync('src/components/ExportModal.tsx', code);
