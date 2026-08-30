const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /const handleWheel = \(e: React\.WheelEvent\)/g,
  "const handleWheel = (e: React.WheelEvent | WheelEvent)"
);

code = code.replace(
  /const preventScroll = \(e: WheelEvent\) => \{\s*e\.preventDefault\(\);\s*\};/g,
  `const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleWheel(e);
    };`
);

code = code.replace(
  /onWheel=\{handleWheel\}/g,
  "" // Remove synthetic listener since we use the native one to ensure preventDefault works
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
