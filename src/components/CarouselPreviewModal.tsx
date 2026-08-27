import React, { useState } from 'react';
import { CarouselProject } from '../types';
import { CanvasSlide } from './CanvasSlide';
import { ChevronLeft, ChevronRight, X, Layers, Instagram } from 'lucide-react';

interface CarouselPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CarouselProject;
}

export const CarouselPreviewModal: React.FC<CarouselPreviewModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  if (!isOpen) return null;

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : project.slides.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < project.slides.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between text-white mb-4 px-2">
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-400" />
            <span className="font-bold text-sm tracking-tight">
              Instagram Karusell-visning
            </span>
            <span className="text-xs text-stone-400">
              Slide {currentIndex + 1} av {project.slides.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel Viewport with navigation */}
        <div className="relative flex items-center justify-center w-full">
          {/* Prev button */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:-left-14 z-30 p-3 bg-stone-900/90 hover:bg-stone-800 text-white rounded-full border border-stone-700 shadow-xl transition-all"
            title="Forrige slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Current Slide Display */}
          <div className="overflow-hidden rounded-2xl shadow-2xl border border-stone-800 bg-stone-900">
            <CanvasSlide
              slide={project.slides[currentIndex]}
              showPurpleGuide={false}
              showInstagramUi={true}
              instagramHandle={project.instagramHandle}
              instagramLocation={project.instagramLocation}
              scale={0.9}
            />
          </div>

          {/* Next button */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:-right-14 z-30 p-3 bg-stone-900/90 hover:bg-stone-800 text-white rounded-full border border-stone-700 shadow-xl transition-all"
            title="Neste slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Dots pagination */}
        <div className="flex items-center gap-2 mt-4">
          {project.slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-7 bg-purple-500'
                  : 'w-2.5 bg-stone-700 hover:bg-stone-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
