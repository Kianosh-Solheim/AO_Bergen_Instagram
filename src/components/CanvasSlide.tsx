import React, { Fragment } from 'react';
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
          slide.galleryLayout === 'grid' ? 'grid grid-cols-2' : 
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
    const hasImage = Boolean(img?.url);

    if (hasImage && img) {
      return (
        <div key={img.id || index}
          className={`relative ${customHeightClass} rounded-sm overflow-hidden bg-stone-200/90 shadow-xs flex flex-col group ${
            interactive ? 'cursor-pointer' : ''
          }`}
          onClick={() => interactive && onOpenImageModal && onOpenImageModal(img, index)}
          title="Klikk for å justere bilde"
        >
          <img
            src={img.url}
            alt={img.caption || slide.title || 'Slide bilde'}
            className="w-full h-full object-cover"
            style={{
              transform: `scale(${img.zoom || 1})`,
              objectPosition: `${img.positionX ?? 50}% ${img.positionY ?? 50}%`,
            }}
            
          />
          {img.credit && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white/95 text-[9px] px-2 py-0.5 rounded font-normal">
              {img.credit}
            </div>
          )}
          {img.labelTag && (
            <div className="absolute top-2.5 right-2.5 bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded shadow-md border border-white/20">
              {img.labelTag}
            </div>
          )}
          {img.signText && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-stone-900 font-bold text-[14px] px-4 py-2 shadow-lg border border-stone-200" style={{ transform: 'translateX(-50%) rotate(-1deg)' }}>
              {img.signText}
            </div>
          )}
        </div>
      );
    }

    // Clean placeholder when no image is present
    return (
      <div key={`placeholder-${index}`}
        className={`relative ${customHeightClass} min-h-[140px] rounded-sm border-2 border-dashed border-stone-300/80 hover:border-purple-400 bg-stone-100/50 hover:bg-purple-50/40 transition-all flex flex-col items-center justify-center p-4 text-center group ${
          interactive ? 'cursor-pointer' : ''
        }`}
        onClick={() => {
          if (interactive && onOpenImageModal) {
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
        }}
        title="Klikk for å laste opp bilde"
      >
        <div className="w-9 h-9 rounded-full bg-stone-200/80 group-hover:bg-purple-100 flex items-center justify-center text-stone-500 group-hover:text-purple-600 mb-1.5 transition-colors">
          <Upload className="w-4 h-4" />
        </div>
        <p className="text-xs font-bold text-stone-700 group-hover:text-purple-900 leading-tight">
          {placeholderLabel}
        </p>
        <p className="text-[10px] text-stone-400 mt-0.5">
          Klikk for å velge bilde (eller la stå tom)
        </p>
      </div>
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
          {slide.preset === 'hook' && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Header Title */}
              <div
                className={`flex flex-col mb-4 ${
                  slide.titleAlign === 'center'
                    ? 'items-center text-center'
                    : slide.titleAlign === 'right'
                    ? 'items-end text-right'
                    : 'items-start text-left'
                }`}
              >
                {slide.superTitle && (
                  <p className="mb-1 text-[17px] text-stone-700 font-medium leading-snug">
                    {slide.superTitle}
                  </p>
                )}
                {slide.title && (
                  <h1
                    className={`font-bold tracking-tight text-stone-900 ${getTitleSizeClass(
                      slide.titleSize
                    )}`}
                  >
                    {slide.title}
                  </h1>
                )}
                {slide.subtitle && (
                  <p className="mt-1 text-[17px] text-stone-700 font-medium leading-snug">
                    {slide.subtitle}
                  </p>
                )}
              </div>

              {/* Central Image inside frame */}
              {renderImageGallery(slide.images, 'Klikk for å laste opp bilde', 'flex-1 min-h-0')}

              {/* Source Credit Footer */}
              {slide.sourceCredit && (
                <div className="mt-2 text-right">
                  <span className="text-[11px] text-stone-500 font-medium">
                    {slide.sourceCredit}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 2. PRESET: FRA DETTE / TIL DETTE (FØR & ETTER) */}
          {slide.preset === 'fra_til' && (
            <div className="flex-1 flex flex-col justify-between gap-3">
              {slide.title && (
                <div
                  className={`text-${slide.titleAlign} ${getTitleSizeClass(
                    slide.titleSize
                  )} font-bold tracking-tight mb-1`}
                >
                  {slide.title}
                </div>
              )}

              {/* Image 1: Fra dette */}
              <div className="flex-1 flex flex-col">
                <p className="text-[18px] font-bold text-stone-900 mb-1 tracking-tight">
                  {slide.images[0]?.caption || 'Fra dette:'}
                </p>
                {renderImageSlot(slide.images[0], 0, 'Last opp bilde (Fra dette)', 'flex-1 min-h-0')}
              </div>

              {/* Image 2: Til dette */}
              <div className="flex-1 flex flex-col">
                <p className="text-[18px] font-bold text-stone-900 mb-1 tracking-tight">
                  {slide.images[1]?.caption || 'Til dette:'}
                </p>
                {renderImageSlot(slide.images[1], 1, 'Last opp bilde (Til dette)', 'flex-1 min-h-0')}
              </div>
            </div>
          )}

          {/* 3. PRESET: FLERBILDE / HVA SOM RIVES / HVA DE VIL BYGGE */}
          {slide.preset === 'flerbilde' && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Headline */}
              {(slide.superTitle || slide.title) && (
                <div
                  className={`mb-3 ${
                    slide.titleAlign === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {slide.superTitle && (
                    <p className="mb-1 text-[15px] text-stone-600 font-medium">
                      {slide.superTitle}
                    </p>
                  )}
                  {slide.title && (
                    <h2
                      className={`font-bold tracking-tight text-stone-900 ${getTitleSizeClass(
                        slide.titleSize
                      )}`}
                    >
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <p className="text-[15px] text-stone-600 font-medium mt-0.5">
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Images Stack / Gallery */}
              <div 
                className={`flex-1 ${
                  slide.galleryLayout === 'horizontal' ? 'flex flex-row' : 
                  slide.galleryLayout === 'grid' ? 'grid grid-cols-2' : 
                  'flex flex-col' // default to vertical
                } ${getSpacingClass(slide.spacingGap)}`}
              >
                {slide.images.length > 0 ? (
                  slide.images.map((img, idx) => renderImageSlot(img, idx, `Last opp bilde #${idx + 1}`, 'flex-1 min-h-0'))
                ) : (
                  renderImageSlot(undefined, 0, 'Klikk for å legge til bilde', 'flex-1 min-h-[160px]')
                )}
              </div>

              {slide.sourceCredit && (
                <div className="mt-2 text-right">
                  <span className="text-[10px] text-stone-500 font-medium">
                    {slide.sourceCredit}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. PRESET: PRISLAPP / NØKKELTALL */}
          {slide.preset === 'prislapp' && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Title & Price Big Stat */}
              {(slide.superTitle || slide.title || slide.priceValue) && (
                <div
                  className={`mb-3 ${
                    slide.titleAlign === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {slide.superTitle && (
                    <p className="mb-1 text-[17px] text-stone-700 font-medium leading-snug">
                      {slide.superTitle}
                    </p>
                  )}
                  {slide.title && (
                    <h2
                      className={`font-bold tracking-tight text-stone-900 ${getTitleSizeClass(
                        slide.titleSize
                      )}`}
                    >
                      {slide.title}
                    </h2>
                  )}

                  {slide.priceValue && (
                    <div className="mt-2">
                      <span className="text-[14px] uppercase tracking-wider text-stone-600 font-bold block">
                        {slide.headingTag || 'Prislapp:'}
                      </span>
                      <p className="text-[32px] sm:text-[36px] font-extrabold text-stone-900 tracking-tight leading-none mt-0.5">
                        {slide.priceValue}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Main Illustration/Photo */}
              {renderImageGallery(slide.images, 'Last opp illustrasjon / bilde (valgfritt)', 'flex-1 min-h-0')}

              {slide.sourceCredit && (
                <div className="mt-2 text-right">
                  <span className="text-[10px] text-stone-500 font-medium">
                    {slide.sourceCredit}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 5. PRESET: SITAT & TEKSTSLIDE MED IKON */}
          {slide.preset === 'sitat' && (
            <div className="flex-1 flex flex-col justify-between py-2">
              {/* Top Icon */}
              <div className="flex justify-center mb-2">
                <span className="text-[38px] leading-none filter drop-shadow-xs">
                  {slide.iconEmoji || '🏛️'}
                </span>
              </div>

              {/* Body Text / Quote */}
              <div className="flex-1 flex items-center justify-center">
                {slide.bodyText ? (
                  <div className="text-[17px] leading-[1.6] text-stone-800 font-normal w-full">
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
                  <span className="text-[11px] text-stone-500 font-medium">
                    {slide.sourceCredit}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 6. PRESET: UNDERTEKST (BILDE MED TEKST UNDER) */}
          {slide.preset === 'undertekst' && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Top Headline */}
              {(slide.superTitle || slide.title) && (
                <div
                  className={`mb-2.5 ${
                    slide.titleAlign === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {slide.superTitle && (
                    <p className="mb-1 text-[17px] text-stone-900 font-semibold leading-snug">
                      {slide.superTitle}
                    </p>
                  )}
                  {slide.title && (
                    <h2
                      className={`font-bold tracking-tight text-stone-900 ${getTitleSizeClass(
                        slide.titleSize
                      )}`}
                    >
                      {slide.title}
                    </h2>
                  )}
                </div>
              )}

              {/* Photo */}
              {renderImageGallery(slide.images, 'Last opp bilde her', 'flex-1 min-h-0')}

              {/* Subtitle / Caption Underneath */}
              {slide.subtitle && (
                <div className="mt-3">
                  <p className="text-[17px] font-semibold text-stone-900 leading-snug">
                    {slide.subtitle}
                  </p>
                </div>
              )}

              {slide.sourceCredit && (
                <div className="mt-2 text-right">
                  <span className="text-[10px] text-stone-500 font-medium">
                    {slide.sourceCredit}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 7. PRESET: MEME / TULL OG TØYS (COMIC SANS, SNAKKEBOBLE, GRU) */}
          {slide.preset === 'meme' && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Meme Title */}
              {(slide.superTitle || slide.title || slide.subtitle) && (
                <div
                  className={`mb-3 ${
                    slide.titleAlign === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {slide.superTitle && (
                    <p className="mb-1 text-[17px] font-bold text-stone-800 whitespace-pre-line leading-tight">
                      {slide.superTitle}
                    </p>
                  )}
                  {slide.title && (
                    <h2
                      className={`font-bold text-stone-900 leading-tight ${
                        slide.font === 'comic' ? 'font-comic' : 'font-agrandir'
                      } ${getTitleSizeClass(slide.titleSize)}`}
                    >
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <p className="text-[17px] font-bold text-stone-800 mt-1 whitespace-pre-line leading-tight">
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Image Container with Yellow Reality Tag, Gru Tag & Speech Bubble */}
              <div className="relative flex-1 flex flex-col min-h-[180px]">
                {renderImageGallery(slide.images, 'Last opp meme/bygningsbilde', 'flex-1 min-h-0')}

                {/* Yellow Reality Tag */}
                {(slide.showRealityTag || slide.headingTag) && (
                  <div className="absolute top-2 left-2 bg-yellow-300 text-stone-950 font-extrabold text-[13px] px-2.5 py-0.5 rounded shadow-sm border border-yellow-400 font-comic tracking-wide pointer-events-none z-20">
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
                    <div className="bg-white text-black font-bold text-[14px] px-3.5 py-2 rounded-xl border-2 border-black shadow-lg font-comic max-w-[200px] text-center leading-tight">
                      {slide.speechBubble.text}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. PRESET: SIDE BY SIDE SAMMENLIGNING */}
          {slide.preset === 'side_by_side' && (
            <div className="flex-1 flex flex-col justify-between">
              {(slide.superTitle || slide.title) && (
                <div
                  className={`mb-3 ${
                    slide.titleAlign === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {slide.superTitle && (
                    <p className="mb-1 text-[17px] text-stone-700 font-medium leading-snug">
                      {slide.superTitle}
                    </p>
                  )}
                  {slide.title && (
                    <h2
                      className={`font-bold tracking-tight text-stone-900 ${getTitleSizeClass(
                        slide.titleSize
                      )}`}
                    >
                      {slide.title}
                    </h2>
                  )}
                </div>
              )}

              {/* 2 Columns */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="flex flex-col h-full">
                  <p className="text-[13px] font-bold text-stone-800 mb-1 truncate">
                    {slide.images[0]?.caption || 'Bilde 1'}
                  </p>
                  {renderImageSlot(slide.images[0], 0, 'Last opp bilde 1', 'flex-1 min-h-0')}
                </div>
                <div className="flex flex-col h-full">
                  <p className="text-[13px] font-bold text-stone-800 mb-1 truncate">
                    {slide.images[1]?.caption || 'Bilde 2'}
                  </p>
                  {renderImageSlot(slide.images[1], 1, 'Last opp bilde 2', 'flex-1 min-h-0')}
                </div>
              </div>
            </div>
          )}
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
