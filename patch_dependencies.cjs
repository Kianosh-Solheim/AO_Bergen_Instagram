const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /\}, \[isDragMode\]\);/,
  "}, [isDragMode, slide, img, onUpdateSlide, index, hasImage, interactive]);"
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
