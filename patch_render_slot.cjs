const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /<Fragment key=\{img.id \|\| idx\}>\s*\{renderImageSlot\(img, idx, `Last opp bilde #\$\{idx \+ 1\}`, 'flex-1 min-h-0'\)\}\s*<\/Fragment>/g,
  "{renderImageSlot(img, idx, `Last opp bilde #${idx + 1}`, 'flex-1 min-h-0')}"
);

code = code.replace(
  /if \(hasImage && img\) \{\s*return \(\s*<div/g,
  "if (hasImage && img) {\n      return (\n        <div key={img.id || index}"
);

code = code.replace(
  /\/\/ Clean placeholder when no image is present\s*return \(\s*<div/g,
  "// Clean placeholder when no image is present\n    return (\n      <div key={`placeholder-${index}`}"
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
