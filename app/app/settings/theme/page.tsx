/**
 * CRMGráfica 2.0 — Painel de Customização Visual
 * 
 * Permite que o cliente escolha cor, paleta e estilo dos botões.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Palette, Square, Rnd } from "lucide-react";

const PALETTES = [
  { id: "mist", name: "Mist", desc: "Azul profissional", color: "#3f586d" },
  { id: "clay", name: "Clay", desc: "Terracota quente", color: "#b05a3d" },
  { id: "plum", name: "Plum", desc: "Ameixa sofisticado", color: "#6c3d54" },
  { id: "sage", name: "Sage", desc: "Verde-erva suave", color: "#506d48" },
  { id: "olive", name: "Olive", desc: "Verde-oliva", color: "#5e572f" },
];

const BUTTON_STYLES = [
  { id: "rounded", label: "Arredondado", example: "rounded-lg" },
  { id: "square", label: "Quadrado", example: "rounded-none" },
  { id: "pill", label: "Pílula", example: "rounded-full" },
] as const;

export default function ThemeSettingsPage() {
  const router = useRouter();
  const [accentHex, setAccentHex] = useState("#3f586d");
  const [buttonStyle, setButtonStyle] = useState("rounded");
  const [borderRadius, setBorderRadius] = useState(8);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load current theme from localStorage or defaults
    const saved = localStorage.getItem("crmgrafica-theme-settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      setAccentHex(parsed.accentHex || "#3f586d");
      setButtonStyle(parsed.buttonStyle || "rounded");
      setBorderRadius(parsed.borderRadius || 8);
    }
  }, []);

  async function handleSave() {
    // Save to localStorage for client-side preview
    localStorage.setItem(
      "crmgrafica-theme-settings",
      JSON.stringify({ accentHex, buttonStyle, borderRadius })
    );
    
    // Save to organization settings via API
    try {
      const res = await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accentHex, buttonStyle, borderRadius }),
      });
      if (res.ok) setSaved(true);
    } catch {}
    
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Customização Visual</h1>
        <p className="mt-1 text-sm text-gray-500">
          Personalize a aparência do sistema para combinar com sua marca.
        </p>
      </div>

      {/* Cor Principal */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-medium text-gray-900">Cor Principal</h2>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={accentHex}
            onChange={(e) => setAccentHex(e.target.value)}
            className="w-12 h-12 rounded-lg cursor-pointer border-0"
          />
          <input
            type="text"
            value={accentHex}
            onChange={(e) => setAccentHex(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => setAccentHex(p.color)}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:border-gray-400 transition-colors"
            >
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-sm text-gray-700">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Estilo dos Botões */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-medium text-gray-900">Estilo dos Botões</h2>
        <div className="grid grid-cols-3 gap-3">
          {BUTTON_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setButtonStyle(style.id)}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                buttonStyle === style.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`mx-auto w-16 h-8 bg-blue-500 ${
                style.id === "rounded" ? "rounded-lg" :
                style.id === "square" ? "rounded-none" : "rounded-full"
              }`} />
              <span className="mt-2 block text-sm text-gray-700">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Raio da Borda */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-medium text-gray-900">Arredondamento</h2>
        <input
          type="range"
          min="0"
          max="24"
          value={borderRadius}
          onChange={(e) => setBorderRadius(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>0px (quadrado)</span>
          <span>{borderRadius}px</span>
          <span>24px (muito arredondado)</span>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="font-medium text-gray-900">Pré-visualização</h2>
        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 text-white font-medium transition-all"
            style={{
              backgroundColor: accentHex,
              borderRadius: buttonStyle === "square" ? "0" : buttonStyle === "pill" ? "9999px" : `${borderRadius}px`,
            }}
          >
            Botão Primário
          </button>
          <button
            className="px-4 py-2 border-2 font-medium transition-all"
            style={{
              borderColor: accentHex,
              color: accentHex,
              borderRadius: buttonStyle === "square" ? "0" : buttonStyle === "pill" ? "9999px" : `${borderRadius}px`,
            }}
          >
            Botão Secundário
          </button>
        </div>
      </div>

      {/* Salvar */}
      <div className="flex justify-end gap-3">
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            ✓ Salvo com sucesso!
          </span>
        )}
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
