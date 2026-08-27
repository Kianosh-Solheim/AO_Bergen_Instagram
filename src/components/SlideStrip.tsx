import React from 'react';
import { Slide, SlidePresetType } from '../types';
import { PRESET_TEMPLATES } from '../data/defaultPresets';
import {
  Plus,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Play,
  Layers,
} from 'lucide-react';

interface SlideStripProps {
  slides: Slide[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: (preset?: SlidePresetType) => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (fromIndex: number, toIndex: number) => void;
  onOpenCarouselPreview: () => void;
}

export const SlideStrip: React.FC<SlideStripProps> = ({
  slides,
  activeSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onOpenCarouselPreview,
}) => {
  return (
    <div className="bg-stone-900 text-white px-4 py-3 border-t border-stone-800 flex items-center justify-between gap-4 z-20">
      {/* Left Info & Carousel Player Button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-stone-300 text-xs font-semibold">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>
            Karusell: <strong className="text-white">{slides.length} slides</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenCarouselPreview}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-medium border border-stone-700 transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current text-purple-400" />
          <span>Forhåndsvis karusell</span>
        </button>
      </div>

      {/* Center Slide Thumbnails Strip */}
      <div className="flex items-center gap-2.5 overflow-x-auto py-1 max-w-2xl scrollbar-thin">
        {slides.map((s, index) => {
          const isActive = index === activeSlideIndex;
          const bg = s.bgColor || '#fffdf7';

          return (
            <div
              key={s.id}
              className={`group relative flex-shrink-0 cursor-pointer transition-all rounded-md p-1 ${
                isActive
                  ? 'bg-purple-600 ring-2 ring-purple-400'
                  : 'bg-stone-800 hover:bg-stone-700 border border-stone-700'
              }`}
              onClick={() => onSelectSlide(index)}
            >
              {/* Mini Slide Card (4:5 ratio) */}
              <div
                className="w-12 h-15 rounded-xs flex flex-col justify-between p-1 overflow-hidden relative shadow-inner select-none"
                style={{ backgroundColor: bg }}
              >
                <span className="text-[8px] font-bold text-stone-800 truncate leading-none">
                  {s.title || s.preset}
                </span>

                {s.images[0]?.url ? (
                  <img
                    src={s.images[0].url}
                    alt="mini"
                    className="w-full h-8 object-cover rounded-xs"
                  />
                ) : (
                  <div className="w-full h-8 bg-stone-200/80 rounded-xs flex items-center justify-center text-[8px] text-stone-600 font-medium px-0.5 text-center">
                    {s.iconEmoji || (s.preset === 'sitat' ? 'Sitat' : 'Mal')}
                  </div>
                )}

                <div className="flex justify-between items-center text-[7px] text-stone-500 font-mono">
                  <span>#{index + 1}</span>
                  <span className="uppercase truncate max-w-[24px]">{s.preset}</span>
                </div>
              </div>

              {/* Quick actions popup on hover when active */}
              {isActive && slides.length > 1 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-stone-950 px-1.5 py-0.5 rounded shadow-lg border border-stone-700 z-30">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveSlide(index, index - 1);
                      }}
                      title="Flytt til venstre"
                      className="text-stone-300 hover:text-white p-0.5"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  {index < slides.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveSlide(index, index + 1);
                      }}
                      title="Flytt til høyre"
                      className="text-stone-300 hover:text-white p-0.5"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlide(index);
                    }}
                    title="Dupliser slide"
                    className="text-stone-300 hover:text-white p-0.5"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSlide(index);
                    }}
                    title="Slett slide"
                    className="text-red-400 hover:text-red-300 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Slide Button */}
        <button
          type="button"
          onClick={() => onAddSlide('hook')}
          className="flex-shrink-0 w-12 h-15 rounded-md border-2 border-dashed border-stone-600 hover:border-purple-400 hover:bg-stone-800 text-stone-400 hover:text-purple-300 flex flex-col items-center justify-center gap-1 transition-all"
          title="Legg til ny slide i karusellen"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[8px] font-semibold">Ny slide</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {slides.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => onDuplicateSlide(activeSlideIndex)}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg border border-stone-700 text-xs flex items-center gap-1 cursor-pointer"
              title="Dupliser aktiv slide"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dupliser</span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteSlide(activeSlideIndex)}
              className="p-1.5 bg-stone-800 hover:bg-red-950 text-stone-300 hover:text-red-300 rounded-lg border border-stone-700 text-xs flex items-center gap-1 cursor-pointer"
              title="Slett aktiv slide"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Slett</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
