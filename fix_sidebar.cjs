const fs = require('fs');

let file = fs.readFileSync('src/components/EditorSidebar.tsx', 'utf-8');
file = file.replace(
  'export const EditorSidebar: React.FC<EditorSidebarProps> = ({',
  'export const EditorSidebar: React.FC<EditorSidebarProps> = ({\n  project,\n  onUpdateProject,'
);

fs.writeFileSync('src/components/EditorSidebar.tsx', file);
