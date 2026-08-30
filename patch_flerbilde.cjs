const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

const target = `              {/* Images Stack / Gallery */}
              <div 
                className={\`flex-1 \${
                  slide.galleryLayout === 'horizontal' ? 'flex flex-row' : 
                  slide.galleryLayout === 'grid' ? 'grid grid-cols-2' : 
                  'flex flex-col' // default to vertical
                } \${getSpacingClass(slide.spacingGap)}\`}
              >
                {slide.images.length > 0 ? (
                  slide.images.map((img, idx) => renderImageSlot(img, idx, \`Last opp bilde #\${idx + 1}\`, 'flex-1 min-h-0'))
                ) : (
                  renderImageSlot(undefined, 0, 'Klikk for å legge til bilde', 'flex-1 min-h-[160px]')
                )}
              </div>`;

const replacement = `              {/* Images Stack / Gallery */}
              {renderImageGallery(slide.images, 'Klikk for å legge til bilde', 'flex-1 min-h-0')}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/CanvasSlide.tsx', code);
  console.log("Patched flerbilde gallery successfully.");
} else {
  console.log("Could not find the target string.");
}
