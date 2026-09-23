import React, { useState, useRef, useEffect } from 'react';
import { Slide, CarouselProject, SlidePresetType, SlideImage } from './types';
import { INITIAL_PROJECT, PRESET_TEMPLATES } from './data/defaultPresets';
import { loginWithGoogle, logout, auth } from './lib/firebase';
import {
  saveProject,
  SavedProject,
  ProjectStatus,
  PROJECT_STATUSES,
  updateProjectStatus,
} from './lib/projectService';
import { isUserAdmin, syncUserProfile, ADMIN_EMAIL } from './lib/userService';
import { User, onAuthStateChanged } from 'firebase/auth';
import { LibraryModal } from './components/LibraryModal';
import { AdminUsersModal } from './components/AdminUsersModal';
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
  Loader2,
  CheckCircle2,
  Plus,
  ShieldCheck,
  ChevronDown,
  Check,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [currentProjectStatus, setCurrentProjectStatus] = useState<ProjectStatus>('in_progress');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    return localStorage.getItem('ao_current_project_id');
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('ao_last_saved_time');
    return saved ? new Date(saved) : null;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        // Automatically sync account to users collection so admin can view all accounts
        await syncUserProfile(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = isUserAdmin(user?.email);
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

  // Keep currentProjectId synced to local storage
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('ao_current_project_id', currentProjectId);
    } else {
      localStorage.removeItem('ao_current_project_id');
    }
  }, [currentProjectId]);

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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  const handleDeleteSlide = (index: number) => {
    const newSlides = project.slides.filter((_, i) => i !== index);
    setProject({
      ...project,
      slides: newSlides,
    });
    setActiveSlideIndex(Math.max(0, index - 1));
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  const handleSaveImageEdits = (updatedImage: SlideImage) => {
    if (!editingImage) return;
    const updatedImages = [...currentSlide.images];
    updatedImages[editingImage.index] = updatedImage;
    handleUpdateSlide({
      ...currentSlide,
      images: updatedImages,
    });
    setHasUnsavedChanges(true);
  };

  const handleDeleteImage = () => {
    if (!editingImage) return;
    const updatedImages = currentSlide.images.filter((_, i) => i !== editingImage.index);
    handleUpdateSlide({
      ...currentSlide,
      images: updatedImages,
    });
    setHasUnsavedChanges(true);
  };

  // Update background color for all slides in the carousel
  const handleUpdateAllSlidesBgColor = (hex: string) => {
    setProject((prev) => ({
      ...prev,
      slides: prev.slides.map((s) => ({ ...s, bgColor: hex })),
    }));
    setHasUnsavedChanges(true);
  };

  // Reset to default templates from PDF
  const handleResetProject = () => {
    if (window.confirm('Vil du nullstille til standard malsett fra oppskriften?')) {
      setProject(INITIAL_PROJECT);
      setActiveSlideIndex(0);
      setHasUnsavedChanges(true);
    }
  };

  // Save current project (updates existing document if currentProjectId is set, avoiding duplicates)
  const handleSaveProject = async (overrideStatus?: ProjectStatus) => {
    if (!user || isSaving) return;
    setIsSaving(true);
    const statusToSave = overrideStatus || currentProjectStatus;
    try {
      const savedId = await saveProject(
        user.uid,
        project,
        statusToSave,
        currentProjectId || undefined,
        {
          email: user.email,
          displayName: user.displayName,
        }
      );
      setCurrentProjectId(savedId);
      localStorage.setItem('ao_current_project_id', savedId);

      const now = new Date();
      setLastSavedTime(now);
      localStorage.setItem('ao_last_saved_time', now.toISOString());
      setHasUnsavedChanges(false);

      setToastMessage('Innlegget ble lagret!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error('Feil ved lagring av prosjekt', e);
      setToastMessage('Kunne ikke lagre innlegget. Prøv igjen.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveProject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, project, currentProjectId, currentProjectStatus, isSaving]);

  // Start a fresh new project without overwriting the previous one
  const handleCreateNewProject = () => {
    const newProj: CarouselProject = {
      ...INITIAL_PROJECT,
      title: 'Mitt nye innlegg',
    };
    setProject(newProj);
    setCurrentProjectId(null);
    setCurrentProjectStatus('not_started');
    localStorage.removeItem('ao_current_project_id');
    setLastSavedTime(null);
    localStorage.removeItem('ao_last_saved_time');
    setHasUnsavedChanges(false);
    setActiveSlideIndex(0);
    setToastMessage('Startet et nytt innlegg');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLoadProject = (projectDataStr: string, id: string) => {
    try {
      const data = JSON.parse(projectDataStr);
      setProject(data);
      setCurrentProjectId(id);
      setCurrentProjectStatus((data.status as ProjectStatus) || 'in_progress');
      localStorage.setItem('ao_current_project_id', id);
      const now = new Date();
      setLastSavedTime(now);
      localStorage.setItem('ao_last_saved_time', now.toISOString());
      setHasUnsavedChanges(false);
      setActiveSlideIndex(0);
      setIsLibraryOpen(false);
      setToastMessage(`Åpnet "${data.title || 'innlegg'}"`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (e) {
      console.error(e);
      setToastMessage('Kunne ikke laste innlegget');
    }
  };

  const handleProjectRenamed = (id: string, newTitle: string) => {
    if (currentProjectId === id) {
      setProject((prev) => ({ ...prev, title: newTitle }));
    }
  };

  const handleProjectDeleted = (id: string) => {
    if (currentProjectId === id) {
      setCurrentProjectId(null);
      localStorage.removeItem('ao_current_project_id');
      setLastSavedTime(null);
      localStorage.removeItem('ao_last_saved_time');
      setHasUnsavedChanges(true);
      setToastMessage('Det aktive innlegget ble slettet');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Ikke lagret ennå';
    return `Sist kl. ${date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}`;
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
      <header className="bg-white border-b border-stone-200 px-3 sm:px-4 py-2 flex items-center justify-between z-30 shadow-2xs gap-2">
        {/* Brand & Project Title (Editable) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
              AO
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-stone-900 text-xs sm:text-sm tracking-tight truncate">
                  <span className="hidden sm:inline">Instagram Malbygger</span>
                  <span className="sm:hidden">Malbygger</span>
                </span>
                <span className="hidden md:inline-block text-[10px] font-semibold uppercase bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full border border-purple-200 flex-shrink-0">
                  1080 × 1350
                </span>
              </div>
              {/* Post Title Field & Status Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 group">
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => {
                      setProject({ ...project, title: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="text-xs font-bold text-stone-800 hover:text-stone-900 focus:text-stone-900 focus:outline-none focus:bg-stone-100 px-1 py-0.5 rounded -ml-1 w-full max-w-[120px] sm:max-w-[180px] md:max-w-[240px] truncate border border-transparent hover:border-stone-200 focus:border-purple-300 transition-colors"
                    placeholder="Navn på innlegg..."
                    title="Klikk for å gi innlegget et navn"
                  />
                  <Edit2 className="w-3 h-3 text-stone-400 group-hover:text-stone-600 flex-shrink-0" />
                </div>

                {/* Status Dropdown Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className={`text-[10px] uppercase font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-pointer transition-all ${
                      PROJECT_STATUSES[currentProjectStatus]?.badgeBg || 'bg-stone-100'
                    } ${PROJECT_STATUSES[currentProjectStatus]?.badgeText || 'text-stone-700'} ${
                      PROJECT_STATUSES[currentProjectStatus]?.badgeBorder || 'border-stone-300'
                    }`}
                    title="Endre status på innlegget"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        PROJECT_STATUSES[currentProjectStatus]?.dotColor || 'bg-stone-400'
                      }`}
                    />
                    <span>{PROJECT_STATUSES[currentProjectStatus]?.label || 'Status'}</span>
                    <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-48 bg-white rounded-xl shadow-xl border border-stone-200 p-1 animate-in fade-in">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1">
                        Sett innleggsstatus:
                      </div>
                      {(
                        [
                          'not_started',
                          'in_progress',
                          'ready_for_publishing',
                          'published',
                        ] as ProjectStatus[]
                      ).map((st) => {
                        const meta = PROJECT_STATUSES[st];
                        const isSelected = currentProjectStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              setCurrentProjectStatus(st);
                              setIsStatusDropdownOpen(false);
                              setHasUnsavedChanges(true);
                              if (currentProjectId) {
                                updateProjectStatus(currentProjectId, st, {
                                  email: user?.email,
                                  displayName: user?.displayName,
                                });
                                setToastMessage(`Status satt til "${meta.label}"`);
                                setTimeout(() => setToastMessage(null), 2500);
                              }
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-stone-100 text-stone-900 font-bold'
                                : 'text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                              <span>{meta.label}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={logout} className="ml-0.5 sm:ml-2 p-1.5 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex-shrink-0" title="Logg ut">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Quick Helpers */}
        <div className="hidden xl:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRecipeGuideOpen(!isRecipeGuideOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-600" />
            <span>Se oppskriftsregler</span>
          </button>
        </div>

        {/* Right Actions & Save Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Admin User Button (Visible for kianoshsolheim@gmail.com) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold border border-purple-200 transition-colors shadow-2xs whitespace-nowrap"
              title="Admin: Oversikt over alle brukerkontoer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Admin: Brukere</span>
              <span className="sm:hidden">Brukere</span>
            </button>
          )}
          {/* Dedicated Compact Save Button & Last Saved Status */}
          <div className="flex items-center bg-stone-100/90 border border-stone-200 rounded-xl p-1 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleSaveProject('draft')}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                hasUnsavedChanges
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                  : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-200'
              }`}
              title="Lagre innlegg (Ctrl+S / Cmd+S)"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Lagrer...' : 'Lagre'}</span>
            </button>

            <div className="px-1.5 py-0.5 text-left flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isSaving
                      ? 'bg-purple-500 animate-ping'
                      : hasUnsavedChanges
                      ? 'bg-amber-500'
                      : lastSavedTime
                      ? 'bg-emerald-500'
                      : 'bg-stone-400'
                  }`}
                />
                <span className="text-[11px] font-bold text-stone-700 leading-none">
                  {isSaving
                    ? 'Lagrer...'
                    : hasUnsavedChanges
                    ? 'Ulagret'
                    : lastSavedTime
                    ? 'Lagret'
                    : 'Nytt'}
                </span>
              </div>
              <span className="text-[9px] text-stone-500 font-medium leading-none mt-1 whitespace-nowrap hidden sm:inline">
                {formatLastSaved(lastSavedTime)}
              </span>
            </div>
          </div>

          {/* New Post Button */}
          <button
            type="button"
            onClick={handleCreateNewProject}
            title="Start et nytt tomt innlegg"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nytt</span>
          </button>

          {/* Library Button */}
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors whitespace-nowrap"
            title="Åpne bibliotek med lagrede innlegg og utkast"
          >
            <Library className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bibliotek</span>
          </button>

          {/* Carousel Preview Button */}
          <button
            type="button"
            onClick={() => setIsCarouselPreviewOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 text-purple-600 fill-current" />
            <span>Se karusell ({project.slides.length})</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eksporter 1080×1350</span>
            <span className="sm:hidden">Eksporter</span>
          </button>

          {/* Reset Template */}
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

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-stone-900/95 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 border border-stone-700 pointer-events-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
        userEmail={user.email}
        userName={user.displayName}
        currentProjectId={currentProjectId}
        onLoadProject={handleLoadProject}
        onNewProject={handleCreateNewProject}
        onProjectRenamed={handleProjectRenamed}
        onProjectDeleted={handleProjectDeleted}
      />

      {/* Admin Users Management Modal (Only for kianoshsolheim@gmail.com) */}
      {isAdmin && (
        <AdminUsersModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          currentUserEmail={user.email}
        />
      )}

      {/* 1. Image Upload & Crop Modal */}
      <ImageUploaderModal
        isOpen={editingImage !== null}
        onClose={() => setEditingImage(null)}
        image={editingImage?.image || null}
        onSave={handleSaveImageEdits}
        onDelete={handleDeleteImage}
        title={`Juster bilde #${(editingImage?.index ?? 0) + 1}`}
      />

      {/* 2. Export 1080x1350 Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onExportSuccess={async () => {
          if (!user) return;
          try {
            setCurrentProjectStatus('published');
            const id = await saveProject(
              user.uid,
              project,
              'published',
              currentProjectId || undefined,
              { email: user.email, displayName: user.displayName }
            );
            setCurrentProjectId(id);
            localStorage.setItem('ao_current_project_id', id);
            const now = new Date();
            setLastSavedTime(now);
            localStorage.setItem('ao_last_saved_time', now.toISOString());
            setHasUnsavedChanges(false);
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
