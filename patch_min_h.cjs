const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(/<div className="flex-1 flex flex-col justify-between">/g, '<div className="flex-1 flex flex-col justify-between min-h-0">');
code = code.replace(/<div className="flex-1 flex flex-col justify-between py-2">/g, '<div className="flex-1 flex flex-col justify-between py-2 min-h-0">');

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
