import React, { useState, useRef, useEffect } from 'react';
import { Slide, CarouselProject, SlidePresetType, SlideImage } from './types';
import { INITIAL_PROJECT, PRESET_TEMPLATES } from './data/defaultPresets';
import { loginWithGoogle, logout, auth } from './lib/firebase';
import { saveProject, SavedProject } from './lib/projectService';
import { User, onAuthStateChanged } from 'firebase/auth';
import { LibraryModal } from './components/LibraryModal';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { EditorSidebar } from './components/EditorSidebar';
import { SlideStrip } from './components/SlideStrip';
import { ImageUploaderModal } from './components/ImageUploaderModal';
import { ExportModal } from './components/ExportModal';
import { CarouselPreviewModal } from './components/CarouselPreviewModal';
import {
  Download,
  Share2,
  Play,
  RotateCcw,
  BookOpen,
  LogOut,
  Save,
  Library,
  Edit2,
  X,
  Menu,
  Settings2,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const [project, setProject] = useState<CarouselProject>(() => {
    const saved = localStorage.getItem('ao_instagram_project');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Kunne ikke laste lagret prosjekt:', e);
      }
    }
    return INITIAL_PROJECT;
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showPurpleGuide, setShowPurpleGuide] = useState(true);
  const [showInstagramUi, setShowInstagramUi] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(0.85);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCarouselPreviewOpen, setIsCarouselPreviewOpen] = useState(false);
  const [isRecipeGuideOpen, setIsRecipeGuideOpen] = useState(false);

  // Image modal state
  const [editingImage, setEditingImage] = useState<{
    image: SlideImage;
    index: number;
  } | null>(null);

  const activeCanvasRef = useRef<HTMLDivElement | null>(null);

  // Persist project changes to local storage
  useEffect(() => {
    localStorage.setItem('ao_instagram_project', JSON.stringify(project));
    if (project.agrandirVariant) {
      document.documentElement.style.setProperty('--font-agrandir', `"${project.agrandirVariant}", "Plus Jakarta Sans", "Outfit", sans-serif`);
    } else {
      document.documentElement.style.setProperty('--font-agrandir', '"Agrandir-Regular", "Plus Jakarta Sans", "Outfit", sans-serif');
    }
  }, [project]);

  // Ensure activeSlideIndex stays valid
  const currentSlide = project.slides[activeSlideIndex] ?? project.slides[0];

  const handleUpdateSlide = (updatedSlide: Slide) => {
    if (!project.slides[activeSlideIndex]) return;
    const newSlides = [...project.slides];
    newSlides[activeSlideIndex] = updatedSlide;
    setProject({
      ...project,
      slides: newSlides,
    });
  };

  const handleAddSlide = (preset: SlidePresetType = 'hook') => {
    const factory = PRESET_TEMPLATES[preset]?.slideFactory || PRESET_TEMPLATES.hook.slideFactory;
    const newSlide = factory();
    const newSlides = [...project.slides, newSlide];
    setProject({
      ...project,
      slides: newSlides,
    });
    setActiveSlideIndex(newSlides.length - 1);
  };

  const handleDuplicateSlide = (index: number) => {
    const slideToCopy = project.slides[index];
    if (!slideToCopy) return;

    const duplicated: Slide = {
      ...JSON.parse(JSON.stringify(slideToCopy)),
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };

    const newSlides = [...project.slides];
    newSlides.splice(index + 1, 0, duplicated);
    setProject({
      ...project,
      slides: newSlides,
    });
    setActiveSlideIndex(index + 1);
  };

  const handleDeleteSlide = (index: number) => {
    const newSlides = project.slides.filter((_, i) => i !== index);
    setProject({
      ...project,
      slides: newSlides,
    });
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const handleMoveSlide = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= project.slides.length) return;
    const newSlides = [...project.slides];
    const [moved] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, moved);
    setProject({
      ...project,
      slides: newSlides,
    });
    setActiveSlideIndex(toIndex);
  };

  const handleSaveImageEdits = (updatedImage: SlideImage) => {
    if (!editingImage) return;
    const updatedImages = [...currentSlide.images];
    updatedImages[editingImage.index] = updatedImage;
    handleUpdateSlide({
      ...currentSlide,
      images: updatedImages,
    });
  };

  const handleDeleteImage = () => {
    if (!editingImage) return;
    const updatedImages = currentSlide.images.filter((_, i) => i !== editingImage.index);
    handleUpdateSlide({
      ...currentSlide,
      images: updatedImages,
    });
  };

  // Update background color for all slides in the carousel
  const handleUpdateAllSlidesBgColor = (hex: string) => {
    setProject((prev) => ({
      ...prev,
      slides: prev.slides.map((s) => ({ ...s, bgColor: hex })),
    }));
  };

  // Reset to default templates from PDF
  const handleResetProject = () => {
    if (window.confirm('Vil du nullstille til standard malsett fra oppskriften?')) {
      setProject(INITIAL_PROJECT);
      setActiveSlideIndex(0);
    }
  };

  const handleLoadProject = (projectDataStr: string, id: string) => {
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
    <div className="flex flex-col h-screen w-full bg-stone-100 text-stone-900 font-agrandir overflow-hidden">
      {/* Top Application Header */}
      <header className="bg-white border-b border-stone-200 px-3 sm:px-4 py-2.5 flex items-center justify-between z-30 shadow-2xs gap-2">
        {/* Brand & Project Title */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
              AO
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-stone-900 text-sm tracking-tight truncate">
                  <span className="hidden sm:inline">Instagram Malbygger</span>
                  <span className="sm:hidden">Malbygger</span>
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200 flex-shrink-0">
                  1080 × 1350 (4:5)
                </span>
              </div>
              <input
                type="text"
                value={project.title}
                onChange={(e) => setProject({ ...project, title: e.target.value })}
                className="text-xs text-stone-500 font-medium hover:text-stone-900 focus:text-stone-900 focus:outline-none focus:bg-stone-50 px-1 py-0.5 rounded -ml-1 w-full max-w-[140px] sm:max-w-[280px]"
                placeholder="Gi innlegget et navn..."
              />
            </div>
            <button onClick={logout} className="ml-1 sm:ml-4 p-1.5 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex-shrink-0" title="Logg ut">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Quick Helpers */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRecipeGuideOpen(!isRecipeGuideOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-600" />
            <span>Se oppskriftsregler</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={async () => {
              if (!user) return;
              setIsSaving(true);
              try {
                const id = await saveProject(user.uid, project, 'draft', currentProjectId || undefined);
                setCurrentProjectId(id);
                // alert('Utkast lagret!');
              } catch (e) {
                console.error(e);
                alert('Feil ved lagring');
              }
              setIsSaving(false);
            }}
            disabled={isSaving}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Lagrer...' : 'Lagre utkast'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors whitespace-nowrap"
          >
            <Library className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bibliotek</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCarouselPreviewOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 text-purple-600 fill-current" />
            <span>Se karusell ({project.slides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eksporter 1080×1350</span>
            <span className="sm:hidden">Eksporter</span>
          </button>

          <button
            type="button"
            onClick={handleResetProject}
            title="Nullstill til standard mal"
            className="hidden sm:flex p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace (Canvas Area + Sidebar) */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left/Center Canvas Viewport */}
        <div className="flex-1 h-full flex flex-col justify-between relative min-w-0">
          <CanvasWorkspace
            slide={currentSlide}
            showPurpleGuide={showPurpleGuide}
            showInstagramUi={showInstagramUi}
            instagramHandle={project.instagramHandle}
            instagramLocation={project.instagramLocation}
            onUpdateSlide={handleUpdateSlide}
            onOpenImageModal={(image, index) =>
              setEditingImage({ image, index })
            }
            onAddSlide={(preset) => handleAddSlide(preset)}
            activeCanvasRef={activeCanvasRef}
            currentSlideIndex={activeSlideIndex}
            totalSlides={project.slides.length}
            isRecipeGuideOpen={isRecipeGuideOpen}
            setIsRecipeGuideOpen={setIsRecipeGuideOpen}
          />

          {/* Bottom Carousel Management Strip */}
          <SlideStrip
            slides={project.slides}
            activeSlideIndex={activeSlideIndex}
            onSelectSlide={(idx) => setActiveSlideIndex(idx)}
            onAddSlide={(preset) => handleAddSlide(preset)}
            onDuplicateSlide={(idx) => handleDuplicateSlide(idx)}
            onDeleteSlide={(idx) => handleDeleteSlide(idx)}
            onMoveSlide={(from, to) => handleMoveSlide(from, to)}
            onOpenCarouselPreview={() => setIsCarouselPreviewOpen(true)}
          />

          {/* Floating Action Button for Mobile Settings */}
          {!isMobileEditorOpen && (
            <button
              type="button"
              onClick={() => setIsMobileEditorOpen(true)}
              className="lg:hidden absolute bottom-24 right-4 z-40 p-3.5 bg-purple-600 text-white rounded-full shadow-2xl shadow-purple-900/50 hover:bg-purple-700 transition-transform active:scale-95 flex items-center justify-center border border-purple-500"
            >
              <Settings2 className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Right Editor Controls Sidebar */}
        <div 
          className={`
            fixed inset-0 z-50 lg:static lg:z-auto
            ${isMobileEditorOpen ? 'flex' : 'hidden lg:flex'}
            flex-col bg-black/50 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none
          `}
        >
          {/* Mobile Overlay Click-to-close */}
          <div 
            className="flex-1 lg:hidden cursor-pointer" 
            onClick={() => setIsMobileEditorOpen(false)}
            aria-label="Lukk redigeringspanel"
          />
          
          <div className="h-[85vh] lg:h-full w-full lg:w-auto bg-white rounded-t-3xl lg:rounded-none overflow-hidden animate-in slide-in-from-bottom lg:animate-none flex flex-col relative shadow-2xl lg:shadow-none">
            {/* Mobile Drag/Close Indicator */}
            <div className="lg:hidden flex justify-center items-center p-4 bg-stone-50 cursor-pointer active:bg-stone-100" onClick={() => setIsMobileEditorOpen(false)}>
              <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <EditorSidebar
                project={project}
                onUpdateProject={setProject}
                slide={currentSlide}
                onUpdateSlide={handleUpdateSlide}
                onUpdateAllSlidesBgColor={handleUpdateAllSlidesBgColor}
                showPurpleGuide={showPurpleGuide}
                onTogglePurpleGuide={() => setShowPurpleGuide(!showPurpleGuide)}
                showInstagramUi={showInstagramUi}
                onToggleInstagramUi={() => setShowInstagramUi(!showInstagramUi)}
                onOpenImageModal={(image, index) =>
                  setEditingImage({ image, index })
                }
                onAddSlide={(preset) => handleAddSlide(preset)}
              />
            </div>
          </div>
        </div>
        </div>

      {/* MODALS */}
      {/* Library Modal */}
      <LibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        userId={user.uid}
        onLoadProject={handleLoadProject}
      />

      {/* 1. Image Upload & Crop Modal */}
      <ImageUploaderModal
        isOpen={editingImage !== null}
        onClose={() => setEditingImage(null)}
        image={editingImage?.image || null}
        onSave={handleSaveImageEdits}
        onDelete={handleDeleteImage}
        title={`Juster bilde #${(editingImage?.index ?? 0) + 1}`}
      />

      {/* Library Modal */}
      <LibraryModal 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        userId={user.uid}
        onLoadProject={handleLoadProject}
      />

      {/* 2. Export 1080x1350 Modal */}
      <ExportModal
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
        }}
        onClose={() => setIsExportOpen(false)}
        project={project}
        activeSlideIndex={activeSlideIndex}
        activeSlideRef={activeCanvasRef}
      />

      {/* 3. Swipeable Carousel Preview Modal */}
      <CarouselPreviewModal
        isOpen={isCarouselPreviewOpen}
        onClose={() => setIsCarouselPreviewOpen(false)}
        project={project}
      />
    </div>
  );
}
