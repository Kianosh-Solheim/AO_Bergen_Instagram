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

// Insert it before handlePointerDown
code = code.replace(/const hasImage = Boolean\(img\?\.url\);/g, getProxiedUrlCode + '\n  const hasImage = Boolean(img?.url);');

// Replace the img tag
code = code.replace(
  /<img\n\s*src=\{img\.url\}\n\s*alt=\{img\.caption \|\| slide\.title \|\| 'Slide bilde'\}/g,
  `<img
        src={getProxiedUrl(img.url)}
        crossOrigin="anonymous"
        alt={img.caption || slide.title || 'Slide bilde'}`
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
