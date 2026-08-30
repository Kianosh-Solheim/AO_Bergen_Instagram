const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
code = code.replace(
  /import \{ INITIAL_PROJECT, PRESET_TEMPLATES \} from '\.\/data\/defaultPresets';/,
  `import { INITIAL_PROJECT, PRESET_TEMPLATES } from './data/defaultPresets';
import { loginWithGoogle, logout, auth } from './lib/firebase';
import { saveProject, SavedProject } from './lib/projectService';
import { User, onAuthStateChanged } from 'firebase/auth';
import { LibraryModal } from './components/LibraryModal';
import { LogOut, Save, Library } from 'lucide-react';`
);

// State hooks
code = code.replace(
  /export default function App\(\) \{/,
  `export default function App() {\n  const [user, setUser] = useState<User | null>(null);\n  const [isAuthLoading, setIsAuthLoading] = useState(true);\n  const [isLibraryOpen, setIsLibraryOpen] = useState(false);\n  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);\n  const [isSaving, setIsSaving] = useState(false);\n\n  useEffect(() => {\n    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {\n      setUser(currentUser);\n      setIsAuthLoading(false);\n    });\n    return () => unsubscribe();\n  }, []);`
);

// Add Save and Library Actions inside Header
code = code.replace(
  /<div className="flex items-center gap-2">\s*<button\s*type="button"\s*onClick=\{handleResetProject\}/,
  `<div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!user) return;
              setIsSaving(true);
              try {
                const id = await saveProject(user.uid, project, 'draft', currentProjectId || undefined);
                setCurrentProjectId(id);
                alert('Utkast lagret i skyen!');
              } catch (e) {
                console.error(e);
                alert('Feil ved lagring');
              }
              setIsSaving(false);
            }}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Lagrer...' : 'Lagre utkast'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors"
          >
            <Library className="w-3.5 h-3.5" />
            <span>Bibliotek</span>
          </button>
          
          <button
            type="button"
            onClick={handleResetProject}`
);

// Handle Auth View
code = code.replace(
  /return \(\s*<div className="flex flex-col h-screen w-full bg-stone-100 text-stone-900 font-agrandir overflow-hidden">/,
  `const handleLoadProject = (projectDataStr: string, id: string) => {
    try {
      const data = JSON.parse(projectDataStr);
      setProject(data);
      setCurrentProjectId(id);
      setActiveSlideIndex(0);
      setIsLibraryOpen(false);
    } catch (e) {
      console.error(e);
      alert('Kunne ikke laste prosjektet');
    }
  };

  if (isAuthLoading) {
    return <div className="flex h-screen w-full bg-stone-100 items-center justify-center">Laster...</div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full bg-stone-100 items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-2xl shadow-lg mx-auto mb-6">
            AO
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 mb-2">Instagram Malbygger</h1>
          <p className="text-sm text-stone-500 mb-8">Logg inn for å lagre utkast, hente gamle prosjekter og dele innlegg.</p>
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
          >
            Logg inn med Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-stone-100 text-stone-900 font-agrandir overflow-hidden">`
);

// Add Logout button in header
code = code.replace(
  /<\/div>\s*<\/div>\s*\{?\/\* Center Quick Helpers \*\/\}?/,
  `  <button onClick={logout} className="ml-4 p-1.5 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors" title="Logg ut">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Quick Helpers */}`
);

// Add Modals
code = code.replace(
  /\{?\/\* 2. Export 1080x1350 Modal \*\/\}?/,
  `{/* Library Modal */}
      <LibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        userId={user.uid}
        onLoadProject={handleLoadProject}
      />

      {/* 2. Export 1080x1350 Modal */}`
);

fs.writeFileSync('src/App.tsx', code);
