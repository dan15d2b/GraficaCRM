import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DEFAULT_THEME, DARK_THEME, type ThemeConfig } from '@/lib/theme';

const themeUpdateSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Cor inválida'),
    background: z.string().optional(),
    surface: z.string().optional(),
  }).optional(),
  buttonStyle: z.enum(['rounded', 'square', 'pill']).optional(),
  borderRadius: z.number().min(0).max(24).optional(),
  isDark: z.boolean().optional(),
});

const themeStore = new Map<string, ThemeConfig>();

export async function GET() {
  const themes = Array.from(themeStore.values());
  const current = themes[themes.length - 1] || DEFAULT_THEME;
  return NextResponse.json({
    success: true,
    theme: current,
    availableThemes: [
      { name: 'Padrão (Azul)', config: DEFAULT_THEME },
      { name: 'Escuro', config: DARK_THEME },
    ],
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = themeUpdateSchema.parse(body);
    const baseTheme = validated.isDark ? DARK_THEME : DEFAULT_THEME;
    const updated: ThemeConfig = {
      ...baseTheme,
      name: validated.isDark ? 'Personalizado (Escuro)' : 'Personalizado',
      colors: { ...baseTheme.colors, ...(validated.colors || {}) },
      buttonStyle: validated.buttonStyle || baseTheme.buttonStyle,
      borderRadius: validated.borderRadius ?? baseTheme.borderRadius,
      isDark: validated.isDark ?? baseTheme.isDark,
    };
    themeStore.set('current', updated);
    return NextResponse.json({ success: true, theme: updated, message: 'Tema atualizado' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Erro ao atualizar tema' }, { status: 500 });
  }
}
