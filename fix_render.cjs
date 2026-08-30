const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

const lines = code.split('\n');
const start = 146; // 1-based index 146 is array index 145
const end = 228; // array index 227

const newRender = `  const renderImageSlot = (
    img: SlideImage | undefined,
    index: number,
    placeholderLabel = 'Last opp bilde (valgfritt)',
    customHeightClass = 'flex-1'
  ) => {
    return (
      <InteractiveImageSlot
        key={img?.id || \`slot-\$\{index\}\`}
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
  };`;

const newLines = [
  ...lines.slice(0, 145),
  newRender,
  ...lines.slice(228)
];

fs.writeFileSync('src/components/CanvasSlide.tsx', newLines.join('\n'));
