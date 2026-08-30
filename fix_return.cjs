const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /  \};\n\n    <div\n      className="relative/g,
  `  };

  return (
    <div
      className="relative`
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
