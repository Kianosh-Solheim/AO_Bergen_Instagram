const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /<img\n\s*src=\{img\.url\}\n\s*crossOrigin="anonymous"\n\s*alt=\{img\.caption \|\| slide\.title \|\| 'Slide bilde'\}/g,
  `<img
        src={img.url}
        alt={img.caption || slide.title || 'Slide bilde'}`
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
