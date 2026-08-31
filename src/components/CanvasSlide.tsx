import React, { Fragment, useState, useRef, useEffect, MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from 'react';
import { Slide, BrandFont, SlideImage } from '../types';
import {
  Sparkles,
  MessageCircle,
  Heart,
  Bookmark,
  Send,
  MoreHorizontal,
  Upload,
  Image as ImageIcon,
  Move,
  Settings,
  Type,
  MousePointer2,
  X as CloseIcon,
} from 'lucide-react';

interface CanvasSlideProps {
  slide: Slide;
  showPurpleGuide?: boolean;
  showInstagramUi?: boolean;
  instagramHandle?: string;
  instagramLocation?: string;
  scale?: number;
  onUpdateSlide?: (updatedSlide: Slide) => void;
  onOpenImageModal?: (image: SlideImage, index: number) => void;
  interactive?: boolean;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}

export const CanvasSlide: React.FC<CanvasSlideProps> = ({
  slide,
  showPurpleGuide = true,
  showInstagramUi = false,
  instagramHandle = 'ao_bergen',
  instagramLocation = 'Bergen, Hordaland',
  scale = 1,
  onUpdateSlide,
  onOpenImageModal,
  interactive = true,
  canvasRef,
}) => {
  const getFontClass = (font: BrandFont) => {
    switch (font) {
      case 'comic':
        return 'font-comic';
      case 'syne':
        return 'font-syne';
      case 'serif':
        return 'font-serif-clean';
      case 'agrandir':
      default:
        return 'font-agrandir';
    }
  };

  const getTitleSizeClass = (size: 'sm' | 'md' | 'lg' | 'xl') => {
    switch (size) {
      case 'sm':
        return 'text-[28px] leading-[1.2]';
      case 'md':
        return 'text-[36px] leading-[1.18]';
      case 'lg':
        return 'text-[44px] leading-[1.15]';
      case 'xl':
        return 'text-[54px] leading-[1.12]';
      default:
        return 'text-[40px] leading-[1.15]';
    }
  };

  const getSpacingClass = (gap: 'tight' | 'normal' | 'relaxed') => {
    switch (gap) {
      case 'tight':
        return 'gap-2';
      case 'relaxed':
        return 'gap-6';
      case 'normal':
      default:
        return 'gap-4';
    }
  };

  const getTitleStyle = (): React.CSSProperties => {
    const spacing = slide.titleLetterSpacing !== undefined ? slide.titleLetterSpacing : 0.5;
    const style: React.CSSProperties = { letterSpacing: `${spacing}px` };
    if (slide.titleFontSize !== undefined) {
      style.fontSize = `${slide.titleFontSize}px`;
      style.lineHeight = 1.14;
    }
    return style;
  };

  const getSubtitleStyle = (): React.CSSProperties => {
    const spacing = slide.subtitleLetterSpacing !== undefined ? slide.subtitleLetterSpacing : 0.3;
    const style: React.CSSProperties = { letterSpacing: `${spacing}px` };
    if (slide.subtitleFontSize !== undefined) {
      style.fontSize = `${slide.subtitleFontSize}px`;
      style.lineHeight = 1.25;
    }
    return style;
  };

  const getBodyStyle = (): React.CSSProperties => {
    const spacing = slide.bodyLetterSpacing !== undefined ? slide.bodyLetterSpacing : 0.1;
    const style: React.CSSProperties = { letterSpacing: `${spacing}px` };
    if (slide.bodyFontSize !== undefined) {
      style.fontSize = `${slide.bodyFontSize}px`;
      style.lineHeight = 1.55;
    }
    return style;
  };

  // Backwards compatibility helpers
  const getTitleLetterSpacingStyle = getTitleStyle;
  const getSubtitleLetterSpacingStyle = getSubtitleStyle;
  const getBodyLetterSpacingStyle = getBodyStyle;

  const renderHighlightText = (text: string, highlightWords?: string) => {
    if (!highlightWords || !highlightWords.trim()) {
      return text;
    }
    const words = highlightWords.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
    if (words.length === 0) return text;

    // Split text by lines
    return text.split('\n').map((line, lineIdx) => {
      const parts = line.split(new RegExp(`(${words.join('|')})`, 'gi'));
      return (
        <span key={lineIdx} className="block mb-4 last:mb-0">
          {parts.map((part, partIdx) => {
            const isMatch = words.some((w) => part.toLowerCase() === w);
            if (isMatch) {
              return (
                <mark
                  key={partIdx}
                  className="bg-amber-200/80 text-stone-900 px-1 py-0.5 rounded font-semibold"
                >
                  {part}
                </mark>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };


  // Helper to render one or more images based on slide.images (auto-gallery)
  const renderImageGallery = (
    images: SlideImage[],
    placeholderLabel = 'Last opp bilde (valgfritt)',
    customHeightClass = 'flex-1 min-h-0'
  ) => {
    if (!images || images.length === 0) {
      return renderImageSlot(undefined, 0, placeholderLabel, customHeightClass);
    }
    
    if (images.length === 1) {
      return renderImageSlot(images[0], 0, placeholderLabel, customHeightClass);
    }
    
    // Multiple images -> gallery layout
    return (
      <div 
        className={`${customHeightClass} ${
          slide.galleryLayout === 'horizontal' ? 'flex flex-row' : 
          slide.galleryLayout === 'grid' ? (images.length === 3 ? 'grid grid-cols-2 [&>*:first-child]:col-span-2 [&>*:first-child]:aspect-[2/1] [&>*:not(:first-child)]:aspect-square' : 'grid grid-cols-2') : 
          'flex flex-col'
        } ${getSpacingClass(slide.spacingGap)}`}
      >
        {images.map((img, idx) => renderImageSlot(img, idx, `Last opp bilde #${idx + 1}`, 'flex-1 min-h-0'))}
      </div>
    );
  };

  // Helper to render image or clean placeholder
  const renderImageSlot = (
    img: SlideImage | undefined,
    index: number,
    placeholderLabel = 'Last opp bilde (valgfritt)',
    customHeightClass = 'flex-1'
  ) => {
    return (
      <InteractiveImageSlot
        key={`slide-${slide.id}-slot-${index}-${img?.id || 'no-id'}-${img?.url ? 'loaded' : 'empty'}`}
        img={img}
        index={index}
        slide={slide}
        placeholderLabel={placeholderLabel}
        customHeightClass={customHeightClass}
        interactive={interactive}
        onOpenImageModal={onOpenImageModal}
        onUpdateSlide={onUpdateSlide}
      />
    );
  };

  return (
    <div
      className="relative select-none origin-center flex-shrink-0 transition-transform shadow-2xl"
      style={{
        width: '540px',
        height: '675px', // 4:5 aspect ratio (540x675 = 0.5x scale of 1080x1350 for sharp preview)
        transform: `scale(${scale})`,
      }}
    >
      {/* Main Slide Canvas Container */}
      <div
        id={`slide-canvas-${slide.id}`}
        ref={canvasRef}
        className={`relative w-full h-full overflow-hidden flex flex-col justify-between ${getFontClass(
          slide.font
        )}`}
        style={{
          backgroundColor: slide.bgColor || '#fffdf7',
          color: '#1c1917', // rich dark stone for high-contrast readability
        }}
      >
        {/* Instagram Post Header (Optional Mockup) */}
        {showInstagramUi && (
          <div
            id="instagram-header-mock"
            className="flex items-center justify-between px-6 pt-5 pb-2 border-b border-black/5 z-20"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[11px] text-stone-800">
                  AO
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold tracking-tight text-stone-900 leading-tight">
                  {instagramHandle}
                </p>
                <p className="text-[11px] text-stone-500 leading-tight">
                  {instagramLocation}
                </p>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-stone-600" />
          </div>
        )}

        {/* Purple Safe Zone Guide (Canva Alignment Frame) */}
        {showPurpleGuide && (
          <div
            id="purple-safe-guide"
            className="pointer-events-none absolute inset-x-8 inset-y-10 border border-purple-500/70 border-dashed rounded-xs z-30"
          >
            <div className="absolute top-1 left-2 bg-purple-600/90 text-[9px] font-medium text-white px-1.5 py-0.5 rounded tracking-wide uppercase">
              Lilla justeringsramme (Sikkerhetssone)
            </div>
          </div>
        )}

        {/* Main Content Area - Strictly padded to align with the recipe */}
        <div
          className={`relative flex-1 flex flex-col px-8 py-7 z-10 overflow-hidden ${
            showInstagramUi ? 'pt-3 pb-4' : 'pt-9 pb-8'
          }`}
        >
          {/* 1. PRESET: HOOK / ENKELT BILDE */}
          {slide.preset === 'hook' && (() => {
            const isBelow = slide.titlePosition === 'below';
            const headerElement = (
              <div
                className={`flex flex-col ${isBelow ? 'mt-3.5 mb-1' : 'mb-3.5'} ${
                  slide.titleAlign === 'center'
                    ? 'items-center text-center'
                    : slide.titleAlign === 'right'
                    ? 'items-end text-right'
                    : 'items-start text-left'
                }`}
              >
                {slide.superTitle && (
                  <p 
                    style={getSubtitleStyle()}
                    className="mb-1 text-[17px] text-stone-700 font-medium leading-snug"
                  >
                    {slide.superTitle}
                  </p>
                )}
                {slide.title && (
                  <h1
                    style={getTitleStyle()}
                    className={`font-bold text-stone-900 ${
                      !slide.titleFontSize ? getTitleSizeClass(slide.titleSize) : ''
                    }`}
                  >
                    {slide.title}
                  </h1>
                )}
                {slide.subtitle && (
                  <p 
                    style={getSubtitleStyle()}
                    className="mt-1 text-[17px] text-stone-700 font-medium leading-snug"
                  >
                    {slide.subtitle}
                  </p>
                )}
              </div>
            );

            return (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                {!isBelow && headerElement}
                {renderImageGallery(slide.images, 'Klikk for å laste opp bilde', 'flex-1 min-h-0')}
                {isBelow && headerElement}

                {/* Source Credit Footer */}
                {slide.sourceCredit && (
                  <div className="mt-2 text-right">
                    <span 
                      style={getBodyStyle()}
                      className="text-[11px] text-stone-500 font-medium"
                    >
                      {slide.sourceCredit}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 2. PRESET: FRA DETTE / TIL DETTE (FØR & ETTER) */}
          {slide.preset === 'fra_til' && (() => {
            const isBelow = slide.titlePosition === 'below';
            const titleElement = slide.title ? (
              <div
                style={getTitleStyle()}
                className={`text-${slide.titleAlign} ${
                  !slide.titleFontSize ? getTitleSizeClass(slide.titleSize) : ''
                } font-bold ${isBelow ? 'mt-2 mb-1' : 'mb-1'}`}
              >
                {slide.title}
              </div>
            ) : null;

            return (
              <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
                {!isBelow && titleElement}

                {/* Image 1: Fra dette */}
                <div className="flex-1 flex flex-col min-h-0">
                  <p 
                    style={getSubtitleStyle()}
                    className="text-[18px] font-bold text-stone-900 mb-1"
                  >
                    {slide.images[0]?.caption || 'Fra dette:'}
                  </p>
                  {renderImageSlot(slide.images[0], 0, 'Last opp bilde (Fra dette)', 'flex-1 min-h-0')}
                </div>

                {/* Image 2: Til dette */}
                <div className="flex-1 flex flex-col min-h-0">
                  <p 
                    style={getSubtitleStyle()}
                    className="text-[18px] font-bold text-stone-900 mb-1"
                  >
                    {slide.images[1]?.caption || 'Til dette:'}
                  </p>
                  {renderImageSlot(slide.images[1], 1, 'Last opp bilde (Til dette)', 'flex-1 min-h-0')}
                </div>

                {isBelow && titleElement}
              </div>
            );
          })()}

          {/* 3. PRESET: FLERBILDE / HVA SOM RIVES / HVA DE VIL BYGGE */}
          {slide.preset === 'flerbilde' && (() => {
            const isBelow = slide.titlePosition === 'below';
            const headerElement = (slide.superTitle || slide.title || slide.subtitle) ? (
              <div
                className={`${isBelow ? 'mt-3 mb-1' : 'mb-3'} ${
                  slide.titleAlign === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {slide.superTitle && (
                  <p 
                    style={getSubtitleStyle()}
                    className="mb-1 text-[15px] text-stone-600 font-medium"
                  >
                    {slide.superTitle}
                  </p>
                )}
                {slide.title && (
                  <h2
                    style={getTitleStyle()}
                    className={`font-bold text-stone-900 ${
                      !slide.titleFontSize ? getTitleSizeClass(slide.titleSize) : ''
                    }`}
                  >
                    {slide.title}
                  </h2>
                )}
                {slide.subtitle && (
                  <p 
                    style={getSubtitleStyle()}
                    className="text-[15px] text-stone-600 font-medium mt-0.5"
                  >
                    {slide.subtitle}
                  </p>
                )}
              </div>
            ) : null;

            return (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                {!isBelow && headerElement}
                {renderImageGallery(slide.images, 'Klikk for å legge til bilde', 'flex-1 min-h-0')}
                {isBelow && headerElement}

                {slide.sourceCredit && (
                  <div className="mt-2 text-right">
                    <span 
                      style={getBodyStyle()}
                      className="text-[10px] text-stone-500 font-medium"
                    >
                      {slide.sourceCredit}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 4. PRESET: PRISLAPP / NØKKELTALL */}
          {slide.preset === 'prislapp' && (() => {
            const isBelow = slide.titlePosition === 'below';
            const headerElement = (slide.superTitle || slide.title || slide.priceValue) ? (
              <div
                className={`${isBelow ? 'mt-3 mb-1' : 'mb-3'} ${
                  slide.titleAlign === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {slide.superTitle && (
                  <p 
                    style={getSubtitleStyle()}
                    className="mb-1 text-[17px] text-stone-700 font-medium leading-snug"
                  >
                    {slide.superTitle}
                  </p>
                )}
                {slide.title && (
                  <h2
                    style={getTitleStyle()}
                    className={`font-bold text-stone-900 ${
                      !slide.titleFontSize ? getTitleSizeClass(slide.titleSize) : ''
                    }`}
                  >
                    {slide.title}
                  </h2>
                )}

                {slide.priceValue && (
                  <div className="mt-2">
                    <span 
                      style={getSubtitleStyle()}
                      className="text-[14px] uppercase tracking-wider text-stone-600 font-bold block"
                    >
                      {slide.headingTag || 'Prislapp:'}
                    </span>
                    <p 
                      style={getTitleStyle()}
                      className="text-[32px] sm:text-[36px] font-extrabold text-stone-900 leading-none mt-0.5"
                    >
                      {slide.priceValue}
                    </p>
                  </div>
                )}
              </div>
            ) : null;

            return (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                {!isBelow && headerElement}
                {renderImageGallery(slide.images, 'Last opp illustrasjon / bilde (valgfritt)', 'flex-1 min-h-0')}
                {isBelow && headerElement}

                {slide.sourceCredit && (
                  <div className="mt-2 text-right">
                    <span 
                      style={getBodyStyle()}
                      className="text-[10px] text-stone-500 font-medium"
                    >
                      {slide.sourceCredit}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 5. PRESET: SITAT & TEKSTSLIDE MED IKON */}
          {slide.preset === 'sitat' && (
            <div className="flex-1 flex flex-col justify-between py-2 min-h-0">
              {/* Top Icon */}
              <div className="flex justify-center mb-2">
                <span className="text-[38px] leading-none filter drop-shadow-xs">
                  {slide.iconEmoji || '🏛️'}
                </span>
              </div>

              {/* Body Text / Quote */}
              <div className="flex-1 flex items-center justify-center">
                {slide.bodyText ? (
                  <div 
                    style={getBodyStyle()}
                    className="text-[17px] leading-[1.6] text-stone-800 font-normal w-full"
                  >
                    {renderHighlightText(slide.bodyText, slide.highlightWords)}
                  </div>
                ) : (
                  <div className="text-stone-400 text-[15px] italic text-center border border-dashed border-stone-300 rounded-lg p-6 w-full">
                    Skriv inn sitat eller tekst i sidepanelet til høyre
                  </div>
                )}
              </div>

              {/* Source Credit */}
              {slide.sourceCredit && (
                <div className="mt-4 pt-2 border-t border-stone-200/60 text-right">
                  <span 
                    style={getBodyStyle()}
                    className="text-[11px] text-stone-500 font-medium"
                  >
                    {slide.sourceCredit}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 6. PRESET: UNDERTEKST (BILDE MED TEKST UNDER) */}
          {slide.preset === 'undertekst' && (() => {
            const isBelow = slide.titlePosition === 'below';
            const topHeader = (slide.superTitle || slide.title) ? (
              <div
                className={`${isBelow ? 'mt-2.5 mb-1' : 'mb-2.5'} ${
                  slide.titleAlign === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {slide.superTitle && (
                  <p 
                    style={getSubtitleStyle()}
                    className="mb-1 text-[17px] text-stone-900 font-semibold leading-snug"
                  >
                    {slide.superTitle}
                  </p>
                )}
                {slide.title && (
                  <h2
                    style={getTitleStyle()}
                    className={`font-bold text-stone-900 ${
                      !slide.titleFontSize ? getTitleSizeClass(slide.titleSize) : ''
                    }`}
                  >
                    {slide.title}
                  </h2>
                )}
              </div>
            ) : null;

            return (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                {!isBelow && topHeader}
                {renderImageGallery(slide.images, 'Last opp bilde her', 'flex-1 min-h-0')}
                {isBelow && topHeader}

                {/* Subtitle / Caption Underneath */}
                {slide.subtitle && (
                  <div className="mt-2.5">
                    <p 
                      style={getSubtitleStyle()}
                      className="text-[17px] font-semibold text-stone-900 leading-snug"
                    >
                      {slide.subtitle}
                    </p>
                  </div>
                )}

                {slide.sourceCredit && (
                  <div className="mt-2 text-right">
                    <span 
                      style={getBodyStyle()}
                      className="text-[10px] text-stone-500 font-medium"
                    >
                      {slide.sourceCredit}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 7. PRESET: MEME / TULL OG TØYS (COMIC SANS, SNAKKEBOBLE, GRU) */}
          {slide.preset === 'meme' && (() => {
            const isBelow = slide.titlePosition === 'below';
            const headerElement = (slide.superTitle || slide.title || slide.subtitle) ? (
              <div
                className={`${isBelow ? 'mt-3 mb-1' : 'mb-3'} ${
                  slide.titleAlign === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {slide.superTitle && (
                  <p 
                    style={getSubtitleStyle()}
                    className="mb-1 text-[17px] font-bold text-stone-800 whitespace-pre-line leading-tight"
                  >
                    {slide.superTitle}
                  </p>
                )}
                {slide.title && (
                  <h2
                    style={getTitleStyle()}
                    className={`font-bold text-stone-900 leading-tight ${
                      slide.font === 'comic' ? 'font-comic' : 'font-agrandir'
                    } ${!slide.titleFontSize ? getTitleSizeClass(slide.titleSize) : ''}`}
                  >
                    {slide.title}
                  </h2>
                )}
                {slide.subtitle && (
                  <p 
                    style={getSubtitleStyle()}
                    className="text-[17px] font-bold text-stone-800 mt-1 whitespace-pre-line leading-tight"
                  >
                    {slide.subtitle}
                  </p>
                )}
              </div>
            ) : null;

            return (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                {!isBelow && headerElement}

                {/* Image Container with Yellow Reality Tag, Gru Tag & Speech Bubble */}
                <div className="relative flex-1 flex flex-col min-h-[180px]">
                  {renderImageGallery(slide.images, 'Last opp meme/bygningsbilde', 'flex-1 min-h-0')}

                  {/* Yellow Reality Tag */}
                  {(slide.showRealityTag || slide.headingTag) && (
                    <div 
                      style={getSubtitleStyle()}
                      className="absolute top-2 left-2 bg-yellow-300 text-stone-950 font-extrabold text-[13px] px-2.5 py-0.5 rounded shadow-sm border border-yellow-400 font-comic pointer-events-none z-20"
                    >
                      {slide.headingTag || 'rEAliTy:'}
                    </div>
                  )}

                  {/* Speech Bubble Overlay ("Fuck you, historiske Bergen!") */}
                  {slide.speechBubble?.enabled && (
                    <div
                      className={`absolute z-30 pointer-events-none ${
                        slide.speechBubble.position === 'top-right'
                          ? 'top-4 right-4 speech-bubble-bottom-left'
                          : slide.speechBubble.position === 'top-left'
                          ? 'top-4 left-4'
                          : slide.speechBubble.position === 'bottom-left'
                          ? 'bottom-8 left-4'
                          : 'bottom-8 right-4 speech-bubble-top-right'
                      }`}
                      style={{
                        transform: `rotate(${slide.speechBubble.rotation || 0}deg)`,
                      }}
                    >
                      <div 
                        style={getBodyStyle()}
                        className="bg-white text-black font-bold text-[14px] px-3.5 py-2 rounded-xl border-2 border-black shadow-lg font-comic max-w-[200px] text-center leading-tight"
                      >
                        {slide.speechBubble.text}
                      </div>
                    </div>
                  )}
                </div>

                {isBelow && headerElement}
              </div>
            );
          })()}

          {/* 8. PRESET: SIDE BY SIDE SAMMENLIGNING */}
          {slide.preset === 'side_by_side' && (() => {
            const isBelow = slide.titlePosition === 'below';
            const headerElement = (slide.superTitle || slide.title) ? (
              <div
                className={`${isBelow ? 'mt-3 mb-1' : 'mb-3'} ${
                  slide.titleAlign === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {slide.superTitle && (
                  <p 
                    style={getSubtitleStyle()}
                    className="mb-1 text-[17px] text-stone-700 font-medium leading-snug"
                  >
                    {slide.superTitle}
                  </p>
                )}
                {slide.title && (
                  <h2
                    style={getTitleStyle()}
                    className={`font-bold text-stone-900 ${
                      !slide.titleFontSize ? getTitleSizeClass(slide.titleSize) : ''
                    }`}
                  >
                    {slide.title}
                  </h2>
                )}
              </div>
            ) : null;

            return (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                {!isBelow && headerElement}

                {/* 2 Columns */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="flex flex-col h-full">
                    <p 
                      style={getSubtitleStyle()}
                      className="text-[13px] font-bold text-stone-800 mb-1 truncate"
                    >
                      {slide.images[0]?.caption || 'Bilde 1'}
                    </p>
                    {renderImageSlot(slide.images[0], 0, 'Last opp bilde 1', 'flex-1 min-h-0')}
                  </div>
                  <div className="flex flex-col h-full">
                    <p 
                      style={getSubtitleStyle()}
                      className="text-[13px] font-bold text-stone-800 mb-1 truncate"
                    >
                      {slide.images[1]?.caption || 'Bilde 2'}
                    </p>
                    {renderImageSlot(slide.images[1], 1, 'Last opp bilde 2', 'flex-1 min-h-0')}
                  </div>
                </div>

                {isBelow && headerElement}
              </div>
            );
          })()}
        </div>

        {/* Instagram Post Bottom Action Bar (Optional Mockup) */}
        {showInstagramUi && (
          <div
            id="instagram-actions-mock"
            className="px-6 py-3 border-t border-black/5 flex items-center justify-between z-20"
          >
            <div className="flex items-center gap-4 text-stone-700">
              <Heart className="w-5 h-5 cursor-pointer hover:text-red-500 transition-colors" />
              <MessageCircle className="w-5 h-5 cursor-pointer" />
              <Send className="w-5 h-5 cursor-pointer" />
            </div>
            <Bookmark className="w-5 h-5 text-stone-700" />
          </div>
        )}
      </div>
    </div>
  );
};


interface InteractiveImageSlotProps {
  img: SlideImage | undefined;
  index: number;
  slide: Slide;
  placeholderLabel: string;
  customHeightClass: string;
  interactive: boolean;
  onOpenImageModal?: (image: SlideImage | undefined, index: number) => void;
  onUpdateSlide?: (updatedSlide: Slide) => void;
}

const InteractiveImageSlot: React.FC<InteractiveImageSlotProps> = ({
  img,
  index,
  slide,
  placeholderLabel,
  customHeightClass,
  interactive,
  onOpenImageModal,
  onUpdateSlide
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [posOffset, setPosOffset] = useState({ x: img?.positionX ?? 50, y: img?.positionY ?? 50 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if img changes externally
  useEffect(() => {
    if (img) {
      setPosOffset({ x: img.positionX ?? 50, y: img.positionY ?? 50 });
    }
  }, [img?.positionX, img?.positionY]);

  
  
  
  
  const getProxiedUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('blob:')) return url;
    if (url.includes('wsrv.nl')) return url;
    if (url.includes('images.unsplash.com')) return url; // Unsplash is already CORS friendly
    
    // Bruk wsrv.nl som en pålitelig bilde-proxy for statiske sider (siden Github Pages ikke kjører Node.js backend)
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  };

  const hasImage = Boolean(img?.url);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive || !hasImage) return;
    if (isDragMode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      e.stopPropagation(); // Prevent text selection/image dragging
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isDragMode || !img || !containerRef.current) return;
    
    // Calculate movement in percentage of container size
    const rect = containerRef.current.getBoundingClientRect();
    e.stopPropagation();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Sensitivity based on zoom. If zoomed in, moving mouse should pan image.
    // CSS object-position works by percentage (0% to 100%).
    const percentX = (dx / rect.width) * 100;
    const percentY = (dy / rect.height) * 100;
    
    // Note: object-position moves the image. Negative % moves image left/up.
    // Wait, dragging right means object position should go left to reveal left side, 
    // actually standard drag: drag right -> image moves right -> object position % decreases.
    
    setPosOffset(prev => {
      let newX = prev.x - percentX * 0.5; // tweak sensitivity
      let newY = prev.y - percentY * 0.5;
      return { 
        x: Math.max(0, Math.min(100, newX)), 
        y: Math.max(0, Math.min(100, newY)) 
      };
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    if (!isDragging || !isDragMode || !img) return;
    setIsDragging(false);
    
    // Save to slide
    if (onUpdateSlide) {
      const updatedImages = [...slide.images];
      updatedImages[index] = {
        ...img,
        positionX: posOffset.x,
        positionY: posOffset.y
      };
      onUpdateSlide({ ...slide, images: updatedImages });
    }
  };

  const handleWheel = (e: React.WheelEvent | WheelEvent) => {
    if (!interactive || !hasImage || !img || !isDragMode) return;
    e.preventDefault(); // stop page scroll
    e.stopPropagation();
    
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const currentZoom = img.zoom || 1;
    const newZoom = Math.max(1, Math.min(3, currentZoom + zoomDelta));
    
    if (onUpdateSlide && newZoom !== currentZoom) {
      const updatedImages = [...slide.images];
      updatedImages[index] = {
        ...img,
        zoom: newZoom
      };
      onUpdateSlide({ ...slide, images: updatedImages });
    }
  };
  
  // Attach non-passive wheel listener manually because React synthetic wheel events are passive
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isDragMode) return;
    
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleWheel(e);
    };
    
    el.addEventListener('wheel', preventScroll, { passive: false });
    return () => {
      el.removeEventListener('wheel', preventScroll);
    };
  }, [isDragMode, slide, img, onUpdateSlide, index, hasImage, interactive]);

  const handleClick = (e: ReactMouseEvent) => {
    if (!interactive) return;
    
    if (!hasImage) {
      if (onOpenImageModal) {
        const targetImg = img || {
          id: `img-${Date.now()}-${index}`,
          url: '',
          credit: '',
          aspectRatio: '4:3',
          objectFit: 'cover',
          zoom: 1,
          positionY: 50,
          positionX: 50,
        };
        onOpenImageModal(targetImg, index);
      }
      return;
    }

    if (isDragMode) {
      // If we are in drag mode and dragging happened, we probably handled it in pointer events.
      // But we can allow clicking to exit drag mode maybe? 
      return;
    }
    
    // Toggle menu
    setShowMenu(!showMenu);
  };

  if (!hasImage || !img) {
    return (
      <div
        className={`relative ${customHeightClass} min-h-[140px] rounded-sm border-2 border-dashed border-stone-300/80 hover:border-purple-400 bg-stone-100/50 hover:bg-purple-50/40 transition-all flex flex-col items-center justify-center p-4 text-center group ${
          interactive ? 'cursor-pointer' : ''
        }`}
        onClick={handleClick}
      >
        <ImageIcon className="w-8 h-8 text-stone-300 group-hover:text-purple-400 transition-colors mb-2" />
        <span className="text-xs font-semibold text-stone-400 group-hover:text-purple-500">
          {placeholderLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${customHeightClass} rounded-sm overflow-hidden bg-stone-200/90 shadow-xs flex flex-col group ${
        interactive && isDragMode ? 'cursor-grab active:cursor-grabbing' : interactive ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      
      title={isDragMode ? "Dra for å flytte, scroll for å zoome" : "Klikk for meny"}
    >
      <img
        src={getProxiedUrl(img.url)}
        crossOrigin="anonymous"
        alt={img.caption || slide.title || 'Slide bilde'}
        className="w-full h-full object-cover"
        style={{
          transform: `scale(${img.zoom || 1})`,
          objectPosition: `${posOffset.x}% ${posOffset.y}%`,
          transformOrigin: `${posOffset.x}% ${posOffset.y}%`,
        }}
      />
      {img.credit && (
        <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white/95 text-[9px] px-2 py-0.5 rounded font-normal z-10 pointer-events-none">
          {img.credit}
        </div>
      )}
      {img.labelTag && (
        <div className="absolute top-2.5 right-2.5 bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded shadow-md border border-white/20 z-10 pointer-events-none">
          {img.labelTag}
        </div>
      )}
      {img.signText && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-stone-900 font-bold text-[14px] px-4 py-2 shadow-lg border border-stone-200 z-10 pointer-events-none" style={{ transform: 'translateX(-50%) rotate(-1deg)' }}>
          {img.signText}
        </div>
      )}
      
      {/* Interactive Overlay Menu */}
      {interactive && showMenu && !isDragMode && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-2 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-xl shadow-xl flex flex-col overflow-hidden w-48 text-sm">
            <div className="px-3 py-2 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
              <span className="font-bold text-stone-700 text-xs uppercase tracking-wider">Rediger bilde</span>
              <button onClick={() => setShowMenu(false)} className="text-stone-400 hover:text-stone-700">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => { setIsDragMode(true); setShowMenu(false); }}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-purple-50 text-stone-800 text-left transition-colors border-b border-stone-100"
            >
              <Move className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">Endre plassering</span>
            </button>
            <button 
              onClick={() => { if (onOpenImageModal) onOpenImageModal(img, index); setShowMenu(false); }}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-stone-50 text-stone-800 text-left transition-colors border-b border-stone-100"
            >
              <Settings className="w-4 h-4 text-stone-500" />
              <span className="font-medium">Merkelapper & Kilde</span>
            </button>
            <button 
              onClick={() => { 
    if (onOpenImageModal) {
      const targetImg = img || {
        id: `img-${Date.now()}-${index}`,
        url: '',
        credit: '',
        aspectRatio: '4:3',
        objectFit: 'cover',
        zoom: 1,
        positionY: 50,
        positionX: 50,
      };
      onOpenImageModal(targetImg, index); 
    }
    setShowMenu(false); 
  }}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-stone-50 text-stone-800 text-left transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-stone-500" />
              <span className="font-medium">Bytt bilde</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Drag Mode Indicator */}
      {interactive && isDragMode && (
        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-20 flex items-center gap-1.5 pointer-events-none">
          <Move className="w-3.5 h-3.5" />
          Dra & Zoom
        </div>
      )}
      
      {/* Exit Drag Mode Button */}
      {interactive && isDragMode && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsDragMode(false); }}
          className="absolute top-2 right-2 bg-white text-stone-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-30 flex items-center gap-1.5 hover:bg-stone-100 border border-stone-200 cursor-pointer"
        >
          <CloseIcon className="w-3.5 h-3.5" />
          Ferdig
        </button>
      )}
    </div>
  );
};
