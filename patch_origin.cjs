const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /transform: \`scale\(\$\{img\.zoom \|\| 1\}\)\`,\n\s*objectPosition: \`\$\{posOffset\.x\}% \$\{posOffset\.y\}%\`,/,
  `transform: \`scale(\${img.zoom || 1})\`,
          objectPosition: \`\${posOffset.x}% \${posOffset.y}%\`,
          transformOrigin: \`\${posOffset.x}% \${posOffset.y}%\`,`
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
