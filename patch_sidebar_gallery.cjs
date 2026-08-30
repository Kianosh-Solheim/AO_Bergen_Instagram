const fs = require('fs');
let code = fs.readFileSync('src/components/EditorSidebar.tsx', 'utf8');

code = code.replace(
  "{slide.preset === 'flerbilde' && (",
  "{(slide.preset === 'flerbilde' || slide.images.length > 1) && ("
);

fs.writeFileSync('src/components/EditorSidebar.tsx', code);
