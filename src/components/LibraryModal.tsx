import React, { useEffect, useState } from 'react';
import { X, Trash2, Edit, Check } from 'lucide-react';
import { SavedProject, getProjects, deleteProject } from '../lib/projectService';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onLoadProject: (projectData: string, id: string) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, userId, onLoadProject }) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getProjects(userId);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen, userId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Er du sikker på at du vil slette dette utkastet/prosjektet?')) return;
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting project', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Bibliotek / Utkast</h2>
            <p className="text-xs text-stone-500 mt-0.5">Dine lagrede og publiserte prosjekter</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 bg-stone-200 hover:bg-stone-300 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-stone-100/50">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-stone-500 font-medium">Du har ingen lagrede prosjekter enda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-stone-900 line-clamp-1">{proj.title}</h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${proj.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {proj.status === 'published' ? 'Publisert' : 'Utkast'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mb-4">
                      Sist endret: {proj.updatedAt?.toDate ? proj.updatedAt.toDate().toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : 'Nylig'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-stone-100">
                    <button
                      onClick={() => onLoadProject(proj.data, proj.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Åpne
                    </button>
                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
