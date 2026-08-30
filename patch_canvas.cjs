const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

const galleryHelper = `
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
        className={\`\${customHeightClass} \${
          slide.galleryLayout === 'horizontal' ? 'flex flex-row' : 
          slide.galleryLayout === 'grid' ? 'grid grid-cols-2' : 
          'flex flex-col'
        } \${getSpacingClass(slide.spacingGap)}\`}
      >
        {images.map((img, idx) => (
          <React.Fragment key={img.id || idx}>
            {renderImageSlot(img, idx, \`Last opp bilde #\${idx + 1}\`, 'flex-1 min-h-0')}
          </React.Fragment>
        ))}
      </div>
    );
  };
`;

code = code.replace("  // Helper to render image or clean placeholder", galleryHelper + "\n  // Helper to render image or clean placeholder");

// Hook
code = code.replace(
  "{renderImageSlot(slide.images[0], 0, 'Klikk for å laste opp bilde', 'flex-1 min-h-[240px]')}",
  "{renderImageGallery(slide.images, 'Klikk for å laste opp bilde', 'flex-1 min-h-0')}"
);

// Prislapp
code = code.replace(
  "{renderImageSlot(slide.images[0], 0, 'Last opp illustrasjon / bilde (valgfritt)', 'flex-1 min-h-[160px]')}",
  "{renderImageGallery(slide.images, 'Last opp illustrasjon / bilde (valgfritt)', 'flex-1 min-h-0')}"
);

// Undertekst
code = code.replace(
  "{renderImageSlot(slide.images[0], 0, 'Last opp bilde her', 'flex-1 min-h-[160px]')}",
  "{renderImageGallery(slide.images, 'Last opp bilde her', 'flex-1 min-h-0')}"
);

// Meme
code = code.replace(
  "{renderImageSlot(slide.images[0], 0, 'Last opp meme/bygningsbilde', 'flex-1')}",
  "{renderImageGallery(slide.images, 'Last opp meme/bygningsbilde', 'flex-1 min-h-0')}"
);

// fra_til
code = code.replace(
  "{renderImageSlot(slide.images[0], 0, 'Last opp bilde (Fra dette)', 'flex-1 min-h-[110px]')}",
  "{renderImageSlot(slide.images[0], 0, 'Last opp bilde (Fra dette)', 'flex-1 min-h-0')}"
);
code = code.replace(
  "{renderImageSlot(slide.images[1], 1, 'Last opp bilde (Til dette)', 'flex-1 min-h-[110px]')}",
  "{renderImageSlot(slide.images[1], 1, 'Last opp bilde (Til dette)', 'flex-1 min-h-0')}"
);

// side_by_side
code = code.replace(
  "{renderImageSlot(slide.images[0], 0, 'Last opp bilde 1', 'flex-1 min-h-[120px]')}",
  "{renderImageSlot(slide.images[0], 0, 'Last opp bilde 1', 'flex-1 min-h-0')}"
);
code = code.replace(
  "{renderImageSlot(slide.images[1], 1, 'Last opp bilde 2', 'flex-1 min-h-[120px]')}",
  "{renderImageSlot(slide.images[1], 1, 'Last opp bilde 2', 'flex-1 min-h-0')}"
);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
