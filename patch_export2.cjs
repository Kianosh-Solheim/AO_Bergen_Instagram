const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

code = code.replace(
  /activeSlideRef: React\.RefObject<HTMLDivElement \| null>;/,
  `activeSlideRef: React.RefObject<HTMLDivElement | null>;
  onExportSuccess?: () => void;`
);

code = code.replace(
  /activeSlideRef,/,
  `activeSlideRef,
  onExportSuccess,`
);

code = code.replace(
  /setIsExportingSingle\(false\);\n\s*\}\n\s*\};/,
  `setIsExportingSingle(false);
      if (onExportSuccess) onExportSuccess();
    }
  };`
);

code = code.replace(
  /setIsExportingAll\(false\);\n\s*\}\n\s*\};/,
  `setIsExportingAll(false);
      if (onExportSuccess) onExportSuccess();
    }
  };`
);

fs.writeFileSync('src/components/ExportModal.tsx', code);
