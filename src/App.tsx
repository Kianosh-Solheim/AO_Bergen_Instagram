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
import { PWAInstallButton } from './components/PWAInstallButton';
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
  Smartphone,
  MoreVertical,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      <header className="bg-white border-b border-stone-200 px-3 sm:px-4 py-2 z-30 shadow-2xs">
        {/* MOBILE HEADER (< md) */}
        <div className="flex md:hidden items-center justify-between gap-2 w-full">
          {/* Left: Hamburger Button + AO Logo + Compact Title / Status */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-stone-700 hover:text-stone-900 hover:bg-stone-100 active:bg-stone-200 rounded-lg active:scale-95 transition-all flex-shrink-0 cursor-pointer"
              title="Åpne meny & verktøy"
              aria-label="Åpne meny"
            >
              <Menu className="w-5 h-5 text-stone-800" />
            </button>

            <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
              AO
            </div>

            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <input
                type="text"
                value={project.title}
                onChange={(e) => {
                  setProject({ ...project, title: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                className="text-xs font-bold text-stone-900 focus:outline-none focus:bg-stone-100 px-1 py-0.5 rounded -ml-1 w-full truncate border border-transparent focus:border-purple-300"
                placeholder="Navn på innlegg..."
                title="Klikk for å redigere tittel"
              />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center gap-1 text-[10px] text-stone-500 hover:text-stone-800 -mt-0.5 text-left truncate"
                title="Trykk for å endre status i menyen"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    PROJECT_STATUSES[currentProjectStatus]?.dotColor || 'bg-stone-400'
                  }`}
                />
                <span className="font-semibold truncate">
                  {PROJECT_STATUSES[currentProjectStatus]?.label || 'Status'}
                </span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Right: Quick Save + Quick Library + Primary Export */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Quick Save */}
            <button
              type="button"
              onClick={() => handleSaveProject()}
              disabled={isSaving}
              className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-purple-600 text-white shadow-xs animate-pulse'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
              title={
                isSaving
                  ? 'Lagrer...'
                  : hasUnsavedChanges
                  ? 'Ulagrede endringer! Trykk for å lagre'
                  : 'Alt er lagret'
              }
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              ) : hasUnsavedChanges ? (
                <Save className="w-4 h-4 text-white" />
              ) : (
                <Check className="w-4 h-4 text-emerald-600" />
              )}
            </button>

            {/* Quick Library Button */}
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-200 transition-colors cursor-pointer"
              title="Bibliotek (Lagrede innlegg)"
            >
              <Library className="w-4 h-4" />
            </button>

            {/* Quick Export Button */}
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Eksporter til Instagram (1080×1350)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksport</span>
            </button>
          </div>
        </div>

        {/* DESKTOP HEADER (>= md) */}
        <div className="hidden md:flex items-center justify-between gap-3 w-full">
          {/* Brand & Project Title (Editable) */}
          <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                AO
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-stone-900 text-sm tracking-tight truncate">
                    Instagram Malbygger
                  </span>
                  <span className="text-[10px] font-semibold uppercase bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full border border-purple-200 flex-shrink-0">
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
                      className="text-xs font-bold text-stone-800 hover:text-stone-900 focus:text-stone-900 focus:outline-none focus:bg-stone-100 px-1 py-0.5 rounded -ml-1 w-full max-w-[180px] lg:max-w-[240px] truncate border border-transparent hover:border-stone-200 focus:border-purple-300 transition-colors"
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
                      className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-pointer transition-all ${
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
              <button onClick={logout} className="ml-2 p-1.5 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex-shrink-0" title="Logg ut">
                <LogOut className="w-3.5 h-3.5" />
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

          {/* Right Actions & Save Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Admin User Button (Visible for kianoshsolheim@gmail.com on desktop) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold border border-purple-200 transition-colors shadow-2xs whitespace-nowrap"
                title="Admin: Oversikt over alle brukerkontoer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin: Brukere</span>
              </button>
            )}

            {/* Dedicated Compact Save Button & Last Saved Status */}
            <div className="flex items-center bg-stone-100/90 border border-stone-200 rounded-xl p-1 gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSaveProject()}
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                <span className="text-[9px] text-stone-500 font-medium leading-none mt-1 whitespace-nowrap">
                  {formatLastSaved(lastSavedTime)}
                </span>
              </div>
            </div>

            {/* New Post Button */}
            <button
              type="button"
              onClick={handleCreateNewProject}
              title="Start et nytt tomt innlegg"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nytt</span>
            </button>

            {/* Library Button */}
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors whitespace-nowrap cursor-pointer"
              title="Åpne bibliotek med lagrede innlegg og utkast"
            >
              <Library className="w-3.5 h-3.5" />
              <span>Bibliotek</span>
            </button>

            {/* Carousel Preview Button */}
            <button
              type="button"
              onClick={() => setIsCarouselPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-purple-600 fill-current" />
              <span>Se ({project.slides.length})</span>
            </button>

            {/* Export Button */}
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksporter 1080×1350</span>
            </button>

            {/* Reset Template */}
            <button
              type="button"
              onClick={handleResetProject}
              title="Nullstill til standard mal"
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
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

          {/* Floating Action Button for Mobile Slide Editing */}
          {!isMobileEditorOpen && (
            <div className="lg:hidden absolute bottom-20 right-3 z-40 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMobileEditorOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-purple-950/40 border border-purple-400 font-bold text-xs active:scale-95 transition-all cursor-pointer"
                title="Åpne redigering for aktiv slide"
              >
                <Settings2 className="w-4 h-4" />
                <span>Rediger slide #{activeSlideIndex + 1}</span>
              </button>
            </div>
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
          
          <div className="h-[88vh] lg:h-full w-full lg:w-auto bg-white rounded-t-3xl lg:rounded-none overflow-hidden animate-in slide-in-from-bottom lg:animate-none flex flex-col relative shadow-2xl lg:shadow-none pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
            {/* Mobile Header with Title and Close Button */}
            <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
                <div>
                  <h4 className="text-xs font-extrabold text-stone-900 leading-tight">
                    Redigerer slide #{activeSlideIndex + 1}
                  </h4>
                  <p className="text-[10px] text-stone-500 capitalize">
                    Mal: {currentSlide?.preset || 'Standard'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileEditorOpen(false)}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                Ferdig
              </button>
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

      {/* Mobile Comprehensive Navigation & Tools Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 lg:hidden">
          {/* Backdrop click to close */}
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Lukk meny"
          />

          <div className="relative w-[86%] max-w-[340px] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            {/* Drawer Header */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white text-stone-900 flex items-center justify-center font-black text-xs">
                  AO
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white">AO Instagram Malbygger</h3>
                  <p className="text-[10px] text-stone-400">1080 × 1350 · {project.slides.length} slides</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                title="Lukk meny"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Project Title & Status Section */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Navn på innlegg
                  </label>
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => {
                      setProject({ ...project, title: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full text-xs font-bold text-stone-900 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
                    placeholder="Gi innlegget et navn..."
                  />
                </div>

                <div>
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Innleggsstatus:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
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
                          className={`text-left p-2 rounded-xl text-[11px] font-bold flex items-center justify-between border transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                isSelected ? 'bg-white' : meta.dotColor
                              }`}
                            />
                            <span className="truncate">{meta.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save card with timestamp */}
                <div className="pt-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSaving
                          ? 'bg-purple-500 animate-ping'
                          : hasUnsavedChanges
                          ? 'bg-amber-500'
                          : lastSavedTime
                          ? 'bg-emerald-500'
                          : 'bg-stone-400'
                      }`}
                    />
                    <span className="text-[11px] font-semibold text-stone-600">
                      {isSaving
                        ? 'Lagrer...'
                        : hasUnsavedChanges
                        ? 'Ulagrede endringer'
                        : lastSavedTime
                        ? `Lagret ${formatLastSaved(lastSavedTime)}`
                        : 'Ikke lagret'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveProject();
                    }}
                    disabled={isSaving}
                    className="px-2.5 py-1 bg-stone-900 text-white rounded-lg text-xs font-bold active:scale-95 transition-transform"
                  >
                    {isSaving ? 'Lagrer...' : 'Lagre nå'}
                  </button>
                </div>
              </div>

              {/* Main Actions */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2">
                  Handlinger
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsExportOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-stone-900 text-white flex items-center gap-3 font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4 text-purple-300" />
                  <div className="flex-1">
                    <div>Eksporter 1080×1350</div>
                    <div className="text-[10px] font-normal text-stone-300">Last ned ferdig slide/karusell</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLibraryOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 flex items-center gap-3 font-semibold text-stone-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center flex-shrink-0">
                    <Library className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-stone-900">Bibliotek & Utkast</div>
                    <div className="text-[10px] text-stone-500">Åpne tidligere lagrede innlegg</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCarouselPreviewOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 flex items-center gap-3 font-semibold text-stone-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-stone-900">Forhåndsvis swipe-karusell</div>
                    <div className="text-[10px] text-stone-500">Test opplevelsen slik den blir på Instagram</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleCreateNewProject();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 flex items-center gap-3 font-semibold text-stone-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-stone-900">Start nytt tomt innlegg</div>
                    <div className="text-[10px] text-stone-500">Opprett et nytt innlegg fra start</div>
                  </div>
                </button>
              </div>

              {/* Tools & Resources */}
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2">
                  Verktøy & Guider
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsRecipeGuideOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 flex items-center gap-3 font-semibold text-stone-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-stone-900">Se oppskriftsregler</div>
                    <div className="text-[10px] text-stone-500">Strukturregler for suksessfulle karuseller</div>
                  </div>
                </button>

                {/* PWA Install Button Variant Menu */}
                <PWAInstallButton variant="menu" />

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAdminModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center gap-3 font-bold transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-200 text-purple-800 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-purple-900">Admin: Brukere</div>
                      <div className="text-[10px] text-purple-700">Se alle registrerte kontoer</div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleResetProject();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-3 font-semibold transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Nullstill til standard mal</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer with User & Logout */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between flex-shrink-0">
              <div className="min-w-0 pr-2">
                <div className="text-[11px] font-bold text-stone-800 truncate">
                  {user?.displayName || 'Innlogget'}
                </div>
                <div className="text-[10px] text-stone-500 truncate">{user?.email}</div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logg ut</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
