const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

const getProxiedUrlCode = `
  const getProxiedUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('blob:')) return url;
    if (url.includes('wsrv.nl')) return url;
    if (url.includes('images.unsplash.com')) return url; // Unsplash is already CORS friendly
    
    // Bruk wsrv.nl som en pålitelig bilde-proxy for statiske sider (siden Github Pages ikke kjører Node.js backend)
    return \`https://wsrv.nl/?url=\${encodeURIComponent(url)}\`;
  };
`;

code = code.replace(/const hasImage = Boolean\(img\?\.url\);/g, getProxiedUrlCode + '\n  const hasImage = Boolean(img?.url);');

code = code.replace(
  /<img\n\s*src=\{img\.url\}\n\s*alt=\{img\.caption \|\| slide\.title \|\| 'Slide bilde'\}/g,
  `<img
        src={getProxiedUrl(img.url)}
        crossOrigin="anonymous"
        alt={img.caption || slide.title || 'Slide bilde'}`
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
