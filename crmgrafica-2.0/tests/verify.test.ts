import { describe, it, expect } from 'vitest';
import { NAV_DESTINATIONS, NAV_GROUPS } from '@/lib/navigation';
import { PERMISSION_MATRIX, hasPermission, getAccessibleModules } from '@/lib/permissions';
import { DEFAULT_THEME } from '@/lib/theme';
import { AGENT_CONFIGS, criarGatilhoRetirada } from '@/lib/ai-agents';

describe('CRMGráfica 2.0 - Verificações', () => {
  it('deve ter 6 grupos de navegação', () => {
    expect(NAV_GROUPS).toHaveLength(6);
  });

  it('deve ter foco em gráfica (sem clínicas)', () => {
    const labels = NAV_DESTINATIONS.map(d => d.label.toLowerCase());
    // Verifica se há termos relacionados a gráfica
    expect(labels.some(l => l.includes('impressao') || l.includes('impressão') || l.includes('producao'))).toBe(true);
    // Verifica se NÃO há termos de clínica
    expect(labels.some(l => l.includes('canvas') || l.includes('clinica'))).toBe(false);
  });

  it('deve ter permissões granulares', () => {
    expect(hasPermission('producao', 'inbox')).toBe(false);
    expect(hasPermission('producao', 'producao_kanban')).toBe(true);
    expect(hasPermission('financeiro', 'financeiro_caixa')).toBe(true);
    expect(hasPermission('financeiro', 'producao_kanban')).toBe(false);
  });

  it('deve ter agentes configurados', () => {
    expect(Object.keys(AGENT_CONFIGS)).toHaveLength(5);
  });

  it('deve gerar mensagem de retirada', () => {
    const msg = criarGatilhoRetirada('Rua Teste, 123', 'https://maps.google.com');
    expect(msg).toContain('Rua Teste, 123');
    expect(msg.toLowerCase()).toContain('retirada');
  });

  it('deve ter tema sem verde padrão', () => {
    expect(DEFAULT_THEME.colors.primary).toBe('#2563EB');
  });
});
