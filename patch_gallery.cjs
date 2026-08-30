const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

code = code.replace(
  /slide\.galleryLayout === 'grid' \? 'grid grid-cols-2' :/,
  "slide.galleryLayout === 'grid' ? (images.length === 3 ? 'grid grid-cols-2 [&>*:first-child]:col-span-2 [&>*:first-child]:aspect-[2/1] [&>*:not(:first-child)]:aspect-square' : 'grid grid-cols-2') :"
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
