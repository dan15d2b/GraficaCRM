/**
 * CRMGráfica 2.0 — Sistema de Temas e Customização Visual
 * 
 * Permite que cada cliente configure cores, estilos de botões e tema visual.
 * Padrão: paleta profissional em azul (#2563EB), sem verde.
 */

export type ColorScheme = {
  primary: string;      // Cor principal (botões, links, destaques)
  secondary: string;    // Cor secundária
  accent: string;       // Cor de destaque/aviso
  success: string;      // Cor de sucesso
  warning: string;      // Cor de aviso
  danger: string;       // Cor de erro/perigo
  background: string;   // Cor de fundo
  surface: string;      // Cor de superfície/cards
  text: string;         // Cor de texto principal
  textMuted: string;    // Cor de texto secundário
};

export type ButtonStyle = 'rounded' | 'square' | 'pill';

export type ThemeConfig = {
  name: string;
  colors: ColorScheme;
  buttonStyle: ButtonStyle;
  borderRadius: number; // em px
  fontFamily: string;
  isDark: boolean;
};

/**
 * Paleta padrão do CRMGráfica (profissional, sem verde)
 */
export const DEFAULT_THEME: ThemeConfig = {
  name: 'Profissional',
  isDark: false,
  buttonStyle: 'rounded',
  borderRadius: 8,
  fontFamily: 'Inter, system-ui, sans-serif',
  colors: {
    primary: '#2563EB',      // Azul profissional
    secondary: '#64748B',    // Cinza azulado
    accent: '#F59E0B',       // Âmbar para destaques
    success: '#10B981',      // Verde-água (não verde puro)
    warning: '#F59E0B',      // Âmbar
    danger: '#EF4444',       // Vermelho
    background: '#F8FAFC',   // Fundo claro
    surface: '#FFFFFF',      // Superfície branca
    text: '#1E293B',         // Texto escuro
    textMuted: '#64748B',    // Texto secundário
  }
};

/**
 * Tema escuro padrão
 */
export const DARK_THEME: ThemeConfig = {
  name: 'Escuro',
  isDark: true,
  buttonStyle: 'rounded',
  borderRadius: 8,
  fontFamily: 'Inter, system-ui, sans-serif',
  colors: {
    primary: '#3B82F6',
    secondary: '#94A3B8',
    accent: '#FBBF24',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
  }
};

/**
 * Gerador de CSS customizado a partir do tema
 */
export function generateThemeCSS(theme: ThemeConfig): string {
  const { colors, buttonStyle, borderRadius, fontFamily } = theme;
  
  const buttonRadiusMap: Record<ButtonStyle, string> = {
    rounded: `${borderRadius}px`,
    square: '0px',
    pill: '9999px',
  };

  return `
:root {
  /* Cores do tema */
  --color-primary: ${colors.primary};
  --color-primary-hover: ${adjustBrightness(colors.primary, -15)};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-danger: ${colors.danger};
  
  /* Fundo e superfície */
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  
  /* Texto */
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  
  /* Tipografia */
  --font-family: ${fontFamily};
  
  /* Bordas */
  --radius-default: ${borderRadius}px;
  --radius-button: ${buttonRadiusMap[buttonStyle]};
}

/* Estilos de botão baseados no tema */
.btn-primary {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  border-radius: var(--radius-button);
  color: white;
  font-family: var(--font-family);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
`.trim();
}

/**
 * Ajusta brilho de cor HEX
 */
function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

/**
 * Validação de cor HEX
 */
export function isValidHex(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

/**
 * Conversão RGB para HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}