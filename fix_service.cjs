const fs = require('fs');
let file = fs.readFileSync('src/lib/projectService.ts', 'utf-8');
file = file.replace(/InstagramProject/g, 'CarouselProject');
fs.writeFileSync('src/lib/projectService.ts', file);
