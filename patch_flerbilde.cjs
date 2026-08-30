const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  "{renderImageSlot(img, idx, \\`Last opp bilde #\\${idx + 1}\\`, 'flex-1 min-h-[100px]')}",
  "{renderImageSlot(img, idx, \\`Last opp bilde #\\${idx + 1}\\`, 'flex-1 min-h-0')}"
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
