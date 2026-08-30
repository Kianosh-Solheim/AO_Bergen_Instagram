const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

const regex = /const getProxiedUrl = \(url: string \| undefined\) => \{[\s\S]*?return `\/api\/proxy-image\?url=\$\{encodeURIComponent\(url\)\}`;[\s\S]*?\};\n/g;

code = code.replace(regex, '');

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
