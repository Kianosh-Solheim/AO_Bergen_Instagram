const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');
code = code.replace(
  /<div className="flex-1 flex flex-col">/g,
  '<div className="flex-1 flex flex-col min-h-0">'
);
fs.writeFileSync('src/components/CanvasSlide.tsx', code);
