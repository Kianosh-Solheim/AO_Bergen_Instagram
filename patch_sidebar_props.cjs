const fs = require('fs');
let sidebar = fs.readFileSync('src/components/EditorSidebar.tsx', 'utf-8');

sidebar = sidebar.replace(
  'interface EditorSidebarProps {',
  'import { CarouselProject } from "../types";\ninterface EditorSidebarProps {\n  project?: CarouselProject;\n  onUpdateProject?: (project: CarouselProject) => void;'
);

sidebar = sidebar.replace(
  'export function EditorSidebar({',
  'export function EditorSidebar({\n  project,\n  onUpdateProject,'
);

fs.writeFileSync('src/components/EditorSidebar.tsx', sidebar);
