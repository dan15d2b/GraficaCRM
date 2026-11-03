'use client';

import { useState } from 'react';

export function SetupAdminPage() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [formData, setFormData] = useState({
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.adminPassword !== formData.confirmPassword) {
      setError('As senhas não conferem');
      setLoading(false);
      return;
    }

    if (formData.adminPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.adminEmail,
          password: formData.adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Erro ao configurar admin');
        return;
      }

      setSuccess(true);
      setIsConfigured(true);
    } catch (err) {
      setError('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  if (isConfigured || success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6 text-green-600">
            ✅ Painel Admin Configurado
          </h1>
          <p className="text-center text-slate-600 mb-6">
            O painel administrativo foi configurado com sucesso!
          </p>
          <a
            href="/dashboard"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Acessar Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">CRM Gráfica - Setup Admin</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">E-mail do Admin</label>
            <input
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin@seudominio.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Senha</label>
            <input
              type="password"
              value={formData.adminPassword}
              onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Confirmar Senha</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Repita a senha"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Configurando...' : 'Configurar Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}