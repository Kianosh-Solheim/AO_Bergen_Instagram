export type BrandColorId =
  | 'lysegul'
  | 'lysegronn'
  | 'lyselilla'
  | 'lysegul_lys'
  | 'lysegronn_lys'
  | 'lyselilla_lys'
  | 'sand'
  | 'hvit'
  | 'custom';

export interface BrandColorOption {
  id: BrandColorId;
  name: string;
  hex: string;
  badgeBg: string;
  borderCol: string;
  description?: string;
}

export const BRAND_COLORS: BrandColorOption[] = [
  {
    id: 'lysegul',
    name: 'Lysegul (Tydelig)',
    hex: '#fff3d1',
    badgeBg: 'bg-[#fff3d1]',
    borderCol: 'border-amber-300',
    description: 'Varm, myk gulfarge fra oppskriften',
  },
  {
    id: 'lysegronn',
    name: 'Lysegrønn (Tydelig)',
    hex: '#e2f6e5',
    badgeBg: 'bg-[#e2f6e5]',
    borderCol: 'border-emerald-300',
    description: 'Frisk, behagelig grønntone fra oppskriften',
  },
  {
    id: 'lyselilla',
    name: 'Lyselilla (Tydelig)',
    hex: '#ebe4f7',
    badgeBg: 'bg-[#ebe4f7]',
    borderCol: 'border-purple-300',
    description: 'Karakteristisk lyselilla fra oppskriften',
  },
  {
    id: 'lysegul_lys',
    name: 'Lysegul (Pastell #fffdf7)',
    hex: '#fffdf7',
    badgeBg: 'bg-[#fffdf7]',
    borderCol: 'border-amber-200',
    description: 'Original PDF-kode #fffdf7',
  },
  {
    id: 'lysegronn_lys',
    name: 'Lysegrønn (Pastell #f7fff7)',
    hex: '#f7fff7',
    badgeBg: 'bg-[#f7fff7]',
    borderCol: 'border-emerald-200',
    description: 'Original PDF-kode #f7fff7',
  },
  {
    id: 'lyselilla_lys',
    name: 'Lyselilla (Pastell #f7f9ff)',
    hex: '#f7f9ff',
    badgeBg: 'bg-[#f7f9ff]',
    borderCol: 'border-indigo-200',
    description: 'Original PDF-kode #f7f9ff',
  },
  {
    id: 'sand',
    name: 'Varm Sand / Beige',
    hex: '#f5f0e6',
    badgeBg: 'bg-[#f5f0e6]',
    borderCol: 'border-stone-300',
    description: 'Klassisk nøytral arkitekturtone',
  },
  {
    id: 'hvit',
    name: 'Ren Hvit',
    hex: '#ffffff',
    badgeBg: 'bg-white',
    borderCol: 'border-stone-300',
    description: 'Helt hvit bakgrunn',
  },
];

export type BrandFont = 'agrandir' | 'comic' | 'syne' | 'serif';

export type SlidePresetType =
  | 'hook'          // Enkelt bilde med overskrift (Forside)
  | 'fra_til'        // Klassisk "Fra dette / Til dette" (Før og etter)
  | 'flerbilde'      // Hva som rives / Hva de vil bygge (2-3 bilder)
  | 'prislapp'      // Prislapp / Store tall / Nøkkeltall
  | 'sitat'         // Sitat / Tekst med ikon og kilde
  | 'undertekst'    // Bilde med engasjerende tekst under
  | 'meme'          // Lov med litt tull og tøys (snakkeboble, Comic Sans, Gru)
  | 'side_by_side';  // Sammenligning side ved side

export interface SlideImage {
  id: string;
  url: string;
  credit?: string;      // F.eks. "Foto: Bjørn Erik Larsen / Bergens Tidende"
  caption?: string;     // F.eks. "Fra dette:" eller "Hva som rives:"
  aspectRatio?: '4:3' | '16:9' | '1:1' | 'auto' | 'free';
  objectFit?: 'cover' | 'contain';
  zoom?: number;        // 1 to 2
  positionY?: number;   // 0 to 100
  positionX?: number;   // 0 to 100
  labelTag?: string;    // F.eks. "Gru sitt hus | Despicable me" eller "Møllendalsveien 1C"
  signText?: string;    // Skilt tekst som vises underst i selve bildet
}

export interface SpeechBubbleConfig {
  enabled: boolean;
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  font: BrandFont;
  rotation?: number;
}

export interface Slide {
  id: string;
  preset: SlidePresetType;
  superTitle?: string;
  title: string;               // F.eks. "Her skal det bygges..", "Kondolerer, Bergen"
  subtitle?: string;            // F.eks. "Inne på riktig spor, men gått seg vill på veien?"
  headingTag?: string;          // F.eks. "rEAliTy:", "Prislapp:"
  priceValue?: string;          // F.eks. "908 millioner kroner"
  bodyText?: string;            // For sitat/tekst-slides
  highlightWords?: string;      // Ord som skal utheves i rød/gul
  sourceCredit?: string;        // F.eks. "Kilde: Bergens Tidende"
  iconEmoji?: string;           // F.eks. "⚒️", "🏛️", "📢", "💰", "📉"
  bgColor: string;             // F.eks. "#fffdf7", "#f7fff7", "#f7f9ff"
  font: BrandFont;
  titleAlign: 'center' | 'left' | 'right';
  titleSize: 'sm' | 'md' | 'lg' | 'xl';
  spacingGap: 'tight' | 'normal' | 'relaxed';
  galleryLayout?: 'vertical' | 'horizontal' | 'grid'; // Layout for flerbilde
  images: SlideImage[];
  speechBubble?: SpeechBubbleConfig;
  showRealityTag?: boolean;
}

export interface CarouselProject {
  id: string;
  title: string;
  slides: Slide[];
  instagramHandle: string;
  instagramLocation: string;
  caption: string;
  hashtags: string;
}
