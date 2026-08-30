const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

// 1. Add hooks to import
code = code.replace(
  /import React, \{ Fragment \} from 'react';/,
  "import React, { Fragment, useState, useRef, useEffect, MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from 'react';"
);

// 2. Add lucide icons
code = code.replace(
  /Image as ImageIcon,/,
  "Image as ImageIcon,\n  Move,\n  Settings,\n  Type,\n  MousePointer2,\n  X as CloseIcon,"
);

// 3. Replace renderImageSlot
// We will replace the entire renderImageSlot function with a component call.
const slotRegex = /\/\/ Helper to render image or clean placeholder[\s\S]*?if \(interactive && onOpenImageModal\) \{[\s\S]*?onOpenImageModal\(undefined, index\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?>[\s\S]*?<ImageIcon[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?\}/;
code = code.replace(slotRegex, `// Helper to render image or clean placeholder
  const renderImageSlot = (
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
  };`);

fs.writeFileSync('src/components/CanvasSlide.tsx', code);
