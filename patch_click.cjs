const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');
code = code.replace(
  "if (onOpenImageModal) onOpenImageModal(undefined, index);",
  `if (onOpenImageModal) {
        const targetImg = img || {
          id: \`img-\$\{Date.now()\}-\$\{index\}\`,
          url: '',
          credit: '',
          aspectRatio: '4:3',
          objectFit: 'cover',
          zoom: 1,
          positionY: 50,
          positionX: 50,
        };
        onOpenImageModal(targetImg, index);
      }`
);
fs.writeFileSync('src/components/CanvasSlide.tsx', code);
