const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /<React.Fragment key=\{img.id \|\| idx\}>/g,
  '<Fragment key={img.id || idx}>'
);
code = code.replace(
  /<\/React.Fragment>/g,
  '<\/Fragment>'
);

if (!code.includes('Fragment')) {
    // we need to add Fragment to import
} else if (!code.includes('import { Fragment')) {
    code = code.replace(/import React/, 'import React, { Fragment }');
}

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
