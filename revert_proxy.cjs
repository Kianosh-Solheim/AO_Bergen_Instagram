const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

const getProxiedUrlCode = `
  const getProxiedUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('blob:')) return url;
    if (url.includes('api.allorigins.win')) return url;
    if (url.includes('images.unsplash.com')) return url;
    
    return \`https://api.allorigins.win/raw?url=\${encodeURIComponent(url)}\`;
  };
`;

code = code.replace(getProxiedUrlCode, '');

code = code.replace(
  /<img\n\s*src=\{getProxiedUrl\(img\.url\)\}\n\s*crossOrigin="anonymous"\n\s*alt=\{img\.caption \|\| slide\.title \|\| 'Slide bilde'\}/g,
  `<img
        src={img.url}
        alt={img.caption || slide.title || 'Slide bilde'}`
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
