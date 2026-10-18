'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check, CheckCircle } from 'lucide-react';
import { DEFAULT_THEME, DARK_THEME, generateThemeCSS, type ThemeConfig } from '@/lib/theme';

export default function ThemePage() {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchTheme();
  }, []);

  async function fetchTheme() {
    const res = await fetch('/api/theme');
    const data = await res.json();
    if (data.success) setTheme(data.theme);
  }

  async function saveTheme(newTheme: ThemeConfig) {
    const res = await fetch('/api/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTheme),
    });
    const data = await res.json();
    if (data.success) {
      setTheme(newTheme);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tema e Aparência</h1>
        <p className="text-slate-500 mt-1">Personalize cores e estilo do sistema</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Cores Principais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cor Primária</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { color: '#2563EB', name: 'Azul' },
                    { color: '#7C3AED', name: 'Roxo' },
                    { color: '#059669', name: 'Verde' },
                    { color: '#DC2626', name: 'Vermelho' },
                    { color: '#D97706', name: 'Âmbar' },
                    { color: '#0891B2', name: 'Ciano' },
                  ].map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => saveTheme({ ...theme, colors: { ...theme.colors, primary: color } })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        theme.colors.primary === color ? 'border-slate-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Estilo dos Botões</label>
                <div className="flex gap-2">
                  {(['rounded', 'square', 'pill'] as const).map(style => (
                    <Button
                      key={style}
                      variant={theme.buttonStyle === style ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => saveTheme({ ...theme, buttonStyle: style })}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bordas: {theme.borderRadius}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={theme.borderRadius}
                  onChange={e => saveTheme({ ...theme, borderRadius: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temas Prontos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Profissional (Azul)', config: DEFAULT_THEME },
                { name: 'Escuro', config: DARK_THEME },
              ].map(({ name, config }) => (
                <button
                  key={name}
                  onClick={() => saveTheme(config)}
                  className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between transition-all ${
                    theme.name === config.name ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: config.colors.primary }} />
                    <span className="font-medium">{name}</span>
                  </div>
                  {theme.name === config.name && <CheckCircle className="w-5 h-5 text-blue-600" />}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="p-6 rounded-lg border"
                style={{ 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <span className="text-white font-bold">G</span>
                  </div>
                  <span className="font-bold text-xl">CRMGráfica</span>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.colors.surface, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <p className="text-sm font-medium">Card exemplo</p>
                    <p className="text-xs opacity-75 mt-1">Conteúdo do card</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      className="px-4 py-2 text-white font-medium"
                      style={{ 
                        backgroundColor: theme.colors.primary,
                        borderRadius: `${theme.borderRadius}px`,
                      }}
                    >
                      Botão Primário
                    </button>
                    <button 
                      className="px-4 py-2 font-medium border"
                      style={{ 
                        borderColor: theme.colors.primary,
                        color: theme.colors.primary,
                        borderRadius: `${theme.borderRadius}px`,
                      }}
                    >
                      Botão Outline
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {saved && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span>Tema salvo com sucesso!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
