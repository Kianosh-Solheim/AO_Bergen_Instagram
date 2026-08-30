const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  `useEffect(() => {
    localStorage.setItem('ao_instagram_project', JSON.stringify(project));
  }, [project]);`,
  `useEffect(() => {
    localStorage.setItem('ao_instagram_project', JSON.stringify(project));
    if (project.agrandirVariant) {
      document.documentElement.style.setProperty('--font-agrandir', \`"\${project.agrandirVariant}", "Plus Jakarta Sans", "Outfit", sans-serif\`);
    } else {
      document.documentElement.style.setProperty('--font-agrandir', '"Agrandir-Regular", "Plus Jakarta Sans", "Outfit", sans-serif');
    }
  }, [project]);`
);

fs.writeFileSync('src/App.tsx', app);
