const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /'flex-1 min-h-\[100px\]'\)/g,
  "'flex-1 min-h-0')"
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
