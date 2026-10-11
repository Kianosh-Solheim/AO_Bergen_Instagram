export interface NewspaperLogoPreset {
  id: string;
  name: string;
  shortLabel: string;
  defaultSourceCredit: string;
  dataUrl: string;
}

function svgToDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString.trim())
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export const NEWSPAPER_LOGOS: NewspaperLogoPreset[] = [
  {
    id: 'bt_full',
    name: 'Bergens Tidende (Full logo)',
    shortLabel: 'Bergens Tidende',
    defaultSourceCredit: 'Kilde: Bergens Tidende',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 84" fill="none">
        <text x="260" y="60" text-anchor="middle" fill="#111111" font-family="Georgia, 'Times New Roman', Times, serif" font-weight="900" font-size="56" letter-spacing="-1.2">Bergens Tidende</text>
      </svg>
    `),
  },
  {
    id: 'bt_short',
    name: 'BT (Kort logo)',
    shortLabel: 'BT',
    defaultSourceCredit: 'Kilde: Bergens Tidende',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 88" fill="none">
        <text x="80" y="68" text-anchor="middle" fill="#111111" font-family="Georgia, 'Times New Roman', Times, serif" font-weight="900" font-size="74" letter-spacing="-2.5">BT</text>
      </svg>
    `),
  },
  {
    id: 'ba_badge',
    name: 'Bergensavisen (BA Rød/Hvit)',
    shortLabel: 'BA (Rød)',
    defaultSourceCredit: 'Kilde: Bergensavisen (BA)',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 92" fill="none">
        <rect x="14" y="6" width="152" height="80" rx="10" fill="#E30613" />
        <text x="90" y="66" text-anchor="middle" fill="#FFFFFF" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="62" letter-spacing="-2">BA</text>
      </svg>
    `),
  },
  {
    id: 'ba_full',
    name: 'Bergensavisen (Tekst uten bakgrunn)',
    shortLabel: 'Bergensavisen',
    defaultSourceCredit: 'Kilde: Bergensavisen (BA)',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 84" fill="none">
        <text x="240" y="60" text-anchor="middle" fill="#E30613" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="54" letter-spacing="-1.5">Bergensavisen</text>
      </svg>
    `),
  },
  {
    id: 'ba_black',
    name: 'BA (Sort uten bakgrunn)',
    shortLabel: 'BA (Sort)',
    defaultSourceCredit: 'Kilde: Bergensavisen (BA)',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 88" fill="none">
        <text x="80" y="68" text-anchor="middle" fill="#111111" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="72" letter-spacing="-3">BA</text>
      </svg>
    `),
  },
  {
    id: 'nrk',
    name: 'NRK Vestland',
    shortLabel: 'NRK',
    defaultSourceCredit: 'Kilde: NRK Vestland',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 84" fill="none">
        <text x="110" y="64" text-anchor="middle" fill="#111111" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="66" letter-spacing="2">NRK</text>
      </svg>
    `),
  },
  {
    id: 'arkitektnytt',
    name: 'Arkitektnytt',
    shortLabel: 'Arkitektnytt',
    defaultSourceCredit: 'Kilde: Arkitektnytt',
    dataUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 84" fill="none">
        <text x="230" y="58" text-anchor="middle" fill="#111111" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="48" letter-spacing="4">ARKITEKTNYTT</text>
      </svg>
    `),
  },
];
