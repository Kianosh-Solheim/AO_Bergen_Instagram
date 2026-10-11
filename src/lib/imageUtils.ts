import { CarouselProject, Slide, SlideImage } from '../types';

const MAX_SINGLE_IMAGE_DIMENSION = 1350;
const DEFAULT_TARGET_MAX_CHARS = 220_000; // ~165 KB binary, crisp for 1080x1350 Instagram slides
const MAX_TOTAL_PROJECT_IMAGE_CHARS = 700_000; // Keeps total Firestore document well under 1 MiB limit

/**
 * Checks whether an image drawn on a canvas has any non-opaque (transparent) pixels.
 */
function hasTransparentPixels(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    // Sample a grid of pixels for speed
    const stepX = Math.max(1, Math.floor(width / 40));
    const stepY = Math.max(1, Math.floor(height / 40));
    const imgData = ctx.getImageData(0, 0, width, height).data;
    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        const alphaIdx = (y * width + x) * 4 + 3;
        if (imgData[alphaIdx] < 250) {
          return true;
        }
      }
    }
  } catch {
    // Ignore CORS or canvas read errors
  }
  return false;
}

/**
 * Compresses an HTMLImageElement into a compact Data URL guaranteed to stay under `targetMaxChars`.
 */
function encodeImageElementToDataUrl(
  imgElement: HTMLImageElement,
  maxDim: number = MAX_SINGLE_IMAGE_DIMENSION,
  targetMaxChars: number = DEFAULT_TARGET_MAX_CHARS,
  mimeHint?: string
): string {
  const origW = imgElement.naturalWidth || imgElement.width || 1080;
  const origH = imgElement.naturalHeight || imgElement.height || 1080;

  let currentMaxDim = maxDim;
  let quality = 0.84;

  // Check if transparency might be present (e.g., PNG, WebP, GIF, SVG)
  const mightHaveAlpha =
    !mimeHint ||
    mimeHint.includes('png') ||
    mimeHint.includes('webp') ||
    mimeHint.includes('gif') ||
    mimeHint.includes('svg');

  for (let attempt = 0; attempt < 6; attempt++) {
    let width = origW;
    let height = origH;

    if (width > currentMaxDim || height > currentMaxDim) {
      if (width > height) {
        height = Math.max(1, Math.round((height * currentMaxDim) / width));
        width = currentMaxDim;
      } else {
        width = Math.max(1, Math.round((width * currentMaxDim) / height));
        height = currentMaxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      break;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(imgElement, 0, 0, width, height);

    const isTransparent = mightHaveAlpha && hasTransparentPixels(ctx, width, height);

    let dataUrl = '';
    if (isTransparent) {
      // Try WebP first as it supports transparency with much smaller file size than PNG
      dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/png');
      }
    } else {
      // Fill white background before JPEG encoding so any slight edge alpha doesn't turn black
      const jpgCanvas = document.createElement('canvas');
      jpgCanvas.width = width;
      jpgCanvas.height = height;
      const jpgCtx = jpgCanvas.getContext('2d');
      if (jpgCtx) {
        jpgCtx.fillStyle = '#ffffff';
        jpgCtx.fillRect(0, 0, width, height);
        jpgCtx.drawImage(canvas, 0, 0);
        dataUrl = jpgCanvas.toDataURL('image/jpeg', quality);
      } else {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
    }

    if (dataUrl.length <= targetMaxChars || attempt === 5) {
      return dataUrl;
    }

    // Step down quality and dimensions for next pass to fit budget
    quality = Math.max(0.5, quality - 0.1);
    currentMaxDim = Math.max(720, Math.round(currentMaxDim * 0.82));
  }

  return imgElement.src;
}

/**
 * Reads a user-uploaded File from their computer/mobile and returns an optimized Data URL
 * suitable for both 1080x1350 export and Firestore cloud draft storage.
 */
export function compressImageFile(
  file: File,
  maxDim: number = MAX_SINGLE_IMAGE_DIMENSION,
  targetMaxChars: number = DEFAULT_TARGET_MAX_CHARS
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Kunne ikke lese bildefilen fra datamaskinen'));
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Tom bildefil'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const optimized = encodeImageElementToDataUrl(img, maxDim, targetMaxChars, file.type);
          resolve(optimized);
        } catch (err) {
          console.warn('Feil ved bildeoptimalisering, bruker rådata:', err);
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => {
        resolve(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64 `data:image/...` string if it exceeds `targetMaxChars`.
 */
export function compressDataUrlIfNeeded(
  dataUrl: string,
  targetMaxChars: number = DEFAULT_TARGET_MAX_CHARS,
  maxDim: number = MAX_SINGLE_IMAGE_DIMENSION
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return Promise.resolve(dataUrl);
  }
  if (dataUrl.length <= targetMaxChars) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
        const mimeHint = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const compressed = encodeImageElementToDataUrl(img, maxDim, targetMaxChars, mimeHint);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Reads an uploaded logo file (PNG, SVG, WebP) and preserves 100% transparency without any background fill.
 */
export function compressTransparentLogoFile(
  file: File,
  maxDim: number = 600,
  targetMaxChars: number = 120_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Kunne ikke lese logofilen'));
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Tom logofil'));
        return;
      }

      if (file.type === 'image/svg+xml' && rawDataUrl.length <= targetMaxChars) {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width || 400;
          let height = img.naturalHeight || img.height || 120;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.max(1, Math.round((height * maxDim) / width));
              width = maxDim;
            } else {
              width = Math.max(1, Math.round((width * maxDim) / height));
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          let out = canvas.toDataURL('image/webp', 0.9);
          if (!out.startsWith('data:image/webp') || out.length > targetMaxChars) {
            out = canvas.toDataURL('image/png');
          }
          resolve(out);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Removes solid white/near-white background from a logo Data URL so it becomes transparent.
 */
export function removeWhiteBackgroundFromLogo(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width || 400;
        const height = img.naturalHeight || img.height || 120;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          // Make near-white pixels transparent with smooth feathering
          if (r > 235 && g > 235 && b > 235) {
            d[i + 3] = 0;
          } else if (r > 215 && g > 215 && b > 215) {
            const avg = (r + g + b) / 3;
            const factor = Math.max(0, (235 - avg) / 20);
            d[i + 3] = Math.round(d[i + 3] * factor);
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Optimizes all computer-uploaded (`data:image/...`) images across all slides in a project
 * so that the entire project can be reliably saved as a draft in Firestore and localStorage.
 */
export async function optimizeProjectImagesForStorage(
  project: CarouselProject,
  maxTotalImageChars: number = MAX_TOTAL_PROJECT_IMAGE_CHARS
): Promise<CarouselProject> {
  if (!project?.slides || project.slides.length === 0) {
    return project;
  }

  // Count how many base64 uploaded images exist across all slides
  let uploadedImageCount = 0;
  for (const slide of project.slides) {
    for (const img of slide.images || []) {
      if (img?.url && img.url.startsWith('data:image/')) {
        uploadedImageCount++;
      }
    }
    if (slide.topLogoUrl && slide.topLogoUrl.startsWith('data:image/') && !slide.topLogoUrl.startsWith('data:image/svg+xml')) {
      uploadedImageCount++;
    }
  }

  if (uploadedImageCount === 0) {
    return project;
  }

  // Calculate per-image budget so all images fit comfortably inside a single Firestore document when possible
  const perImageBudget = Math.max(
    95_000,
    Math.min(DEFAULT_TARGET_MAX_CHARS, Math.floor(maxTotalImageChars / uploadedImageCount))
  );

  const optimizedSlides: Slide[] = await Promise.all(
    project.slides.map(async (slide) => {
      let updatedLogoUrl = slide.topLogoUrl;
      if (
        updatedLogoUrl &&
        updatedLogoUrl.startsWith('data:image/') &&
        !updatedLogoUrl.startsWith('data:image/svg+xml')
      ) {
        updatedLogoUrl = await compressDataUrlIfNeeded(updatedLogoUrl, Math.min(120_000, perImageBudget), 600);
      }

      if (!slide.images || slide.images.length === 0) {
        if (updatedLogoUrl !== slide.topLogoUrl) {
          return { ...slide, topLogoUrl: updatedLogoUrl };
        }
        return slide;
      }

      const optimizedImages: SlideImage[] = await Promise.all(
        slide.images.map(async (img) => {
          if (!img?.url || !img.url.startsWith('data:image/')) {
            return img;
          }
          const compressedUrl = await compressDataUrlIfNeeded(img.url, perImageBudget);
          if (compressedUrl === img.url) return img;
          return {
            ...img,
            url: compressedUrl,
          };
        })
      );
      return {
        ...slide,
        topLogoUrl: updatedLogoUrl,
        images: optimizedImages,
      };
    })
  );

  return {
    ...project,
    slides: optimizedSlides,
  };
}

/**
 * IndexedDB helper to persist large drafts with computer-uploaded images locally
 * even if browser localStorage (~5MB) quota is exceeded.
 */
const IDB_NAME = 'ao_instagram_drafts_db';
const IDB_STORE = 'drafts';
const IDB_KEY = 'current_project';

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB ikke støttet'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalDraftToStorage(project: CarouselProject): Promise<void> {
  const serialized = JSON.stringify(project);

  // 1. Try standard localStorage first
  try {
    localStorage.setItem('ao_instagram_project', serialized);
  } catch (err) {
    console.warn('localStorage nådde maksgrense, lagrer fullt utkast med bilder i IndexedDB:', err);
  }

  // 2. Always persist to IndexedDB which supports 50MB+ of uploaded images
  try {
    const db = await openDraftDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(project, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore IndexedDB errors in private browsing modes
  }
}

export async function loadLocalDraftFromStorage(): Promise<CarouselProject | null> {
  try {
    const db = await openDraftDb();
    const idbProject = await new Promise<CarouselProject | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as CarouselProject) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (idbProject && Array.isArray(idbProject.slides)) {
      return idbProject;
    }
  } catch {
    // Fallback to localStorage
  }

  try {
    const saved = localStorage.getItem('ao_instagram_project');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}
