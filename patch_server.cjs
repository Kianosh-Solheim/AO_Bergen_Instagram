const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importCors = `import cors from 'cors';\nimport https from 'https';\nimport http from 'http';\n`;
code = code.replace(/import express from 'express';/g, `import express from 'express';\n${importCors}`);

const proxyRoute = `
// API: Image Proxy to bypass CORS issues for canvas exports
app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url as string;
  
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const protocol = imageUrl.startsWith('https') ? https : http;
    
    protocol.get(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (proxyRes) => {
      // Forward the content type
      const contentType = proxyRes.headers['content-type'];
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      
      // Allow CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for a year

      // Pipe the image data directly to the client
      proxyRes.pipe(res);
    }).on('error', (e) => {
      console.error('Proxy request error:', e.message);
      res.status(500).send('Error fetching image');
    });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error');
  }
});
`;

code = code.replace(/\/\/ Vite Middleware/g, proxyRoute + '\n// Vite Middleware');

fs.writeFileSync('server.ts', code);
