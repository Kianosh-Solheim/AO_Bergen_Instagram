const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /  \};\n    <div\n      className="relative select-none/g,
  `  };

  return (
    <div
      className="relative select-none`
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
