const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

const oldBlock = `{/* Hidden container to render all slides for Export */}
        <div style={{ position: 'fixed', left: '-10000px', top: '-10000px', pointerEvents: 'none' }}>
          {project.slides.map((slide, index) => (
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
          ))}
        </div>`;

const newBlock = `{/* Hidden container to render all slides for Export */}
        <div style={{ position: 'fixed', left: '-10000px', top: '-10000px', pointerEvents: 'none' }}>
          {project.slides.map((slide, index) => {
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

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('src/components/ExportModal.tsx', code);
