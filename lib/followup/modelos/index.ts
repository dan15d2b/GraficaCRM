/**
 * O CATÁLOGO DE MODELOS — a face do módulo.
 */
import { MODELOS_DE_CLINICA } from "./clinica";
import { MODELOS_DE_GRAFICA } from "./grafica";
import type { ModeloDeFollowup, NichoDeModelo } from "./tipos";

export type { ModeloDeFollowup, NichoDeModelo, EntradaDoModelo } from "./tipos";
export { toquesDoModelo, horizonteDoModeloMs, NICHOS_DE_MODELO } from "./tipos";

export const MODELOS_DE_FOLLOWUP: readonly ModeloDeFollowup[] = [
  ...MODELOS_DE_CLINICA,
  ...MODELOS_DE_GRAFICA,
];

export function modeloPorId(id: string): ModeloDeFollowup | undefined {
  return MODELOS_DE_FOLLOWUP.find((m) => m.id === id);
}

export function modelosDoNicho(nicho: NichoDeModelo): ModeloDeFollowup[] {
  return MODELOS_DE_FOLLOWUP.filter((m) => m.nicho === nicho);
}
