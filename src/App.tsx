import React, { useState, useRef, useEffect } from 'react';
import { Slide, CarouselProject, SlidePresetType, SlideImage } from './types';
import { INITIAL_PROJECT, PRESET_TEMPLATES } from './data/defaultPresets';
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
} from 'lucide-react';

export default function App() {
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

  return (
    <div className="flex flex-col h-screen w-full bg-stone-100 text-stone-900 font-agrandir overflow-hidden">
      {/* Top Application Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-2.5 flex items-center justify-between z-30 shadow-2xs">
        {/* Brand & Project Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              AO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-stone-900 text-sm tracking-tight">
                  Instagram Malbygger
                </h1>
                <span className="text-[10px] font-semibold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                  1080 × 1350 (4:5)
                </span>
              </div>
              <input
                type="text"
                value={project.title}
                onChange={(e) => setProject({ ...project, title: e.target.value })}
                className="text-xs text-stone-500 font-medium hover:text-stone-900 focus:text-stone-900 focus:outline-none focus:bg-stone-50 px-1 py-0.5 rounded -ml-1 w-52 sm:w-72"
                placeholder="Gi innlegget et navn..."
              />
            </div>
          </div>
        </div>

        {/* Center Quick Helpers */}
        <div className="hidden md:flex items-center gap-2">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCarouselPreviewOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-purple-600 fill-current" />
            <span>Se karusell ({project.slides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Eksporter 1080×1350</span>
          </button>

          <button
            type="button"
            onClick={handleResetProject}
            title="Nullstill til standard mal"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace (Canvas Area + Sidebar) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left/Center Canvas Viewport */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
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
        </div>

        {/* Right Editor Controls Sidebar */}
        <EditorSidebar
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

      {/* MODALS */}
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
