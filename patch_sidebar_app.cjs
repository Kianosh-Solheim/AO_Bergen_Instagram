const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  '<EditorSidebar',
  '<EditorSidebar\n          project={project}\n          onUpdateProject={setProject}'
);

fs.writeFileSync('src/App.tsx', app);
