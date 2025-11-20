/**
 * Utilitários para cálculos e manipulação de cores no renderer
 */

/**
 * Converte uma cor hexadecimal para RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');

  if (cleanHex.length !== 6) {
    return null;
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b };
}

/**
 * Converte RGB para hexadecimal
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calcula uma cor mais escura (hover) baseada em uma cor hexadecimal
 */
export function calculateHoverColor(hex: string, darkenAmount: number = 20): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }

  const hoverR = Math.max(0, rgb.r - darkenAmount);
  const hoverG = Math.max(0, rgb.g - darkenAmount);
  const hoverB = Math.max(0, rgb.b - darkenAmount);

  return rgbToHex(hoverR, hoverG, hoverB);
}

/**
 * Calcula uma cor mais clara (light) baseada em uma cor hexadecimal com opacidade
 */
export function calculateLightColor(hex: string, opacity: string = '1A'): string {
  return `${hex}${opacity}`;
}

/**
 * Aplica uma cor accent ao DOM
 */
export function applyAccentColorToDOM(accentColor: string): void {
  const root = document.documentElement;
  root.style.setProperty('--accent-color', accentColor);

  const hoverColor = calculateHoverColor(accentColor);
  root.style.setProperty('--accent-color-hover', hoverColor);

  const lightColor = calculateLightColor(accentColor);
  root.style.setProperty('--accent-color-light', lightColor);
}
