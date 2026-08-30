const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /setIsDragging\(true\);\n      setDragStart\(\{ x: e\.clientX, y: e\.clientY \}\);\n      e\.preventDefault\(\);/g,
  `setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      e.stopPropagation();`
);
code = code.replace(
  /const dx = e\.clientX - dragStart\.x;/g,
  `e.stopPropagation();
    const dx = e.clientX - dragStart.x;`
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
