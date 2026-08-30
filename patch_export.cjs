const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<ExportModal\s+isOpen=\{isExportOpen\}/,
  `<ExportModal
        isOpen={isExportOpen}
        onExportSuccess={async () => {
          if (!user) return;
          try {
            const id = await saveProject(user.uid, project, 'published', currentProjectId || undefined);
            setCurrentProjectId(id);
            // Optional: alert('Prosjekt markert som publisert!');
          } catch (e) {
            console.error('Kunne ikke markere som publisert', e);
          }
        }}`
);
fs.writeFileSync('src/App.tsx', code);
