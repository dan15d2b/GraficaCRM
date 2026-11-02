import { useState } from 'react';

export function SetupPage() {
  const [step, setStep] = useState<'license' | 'org' | 'admin' | 'ai'>('license');
  
  const [formData, setFormData] = useState({
    licenseKey: '',
    organizationName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    aiKey: '',
  });

  const handleSubmit = async () => {
    const response = await fetch('/api/v1/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (response.ok) {
      window.location.href = '/app';
    } else {
      alert('Erro na instalação. Verifique os dados.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">CRM Gráfica 2.0 - Instalação</h1>
        
        {step === 'license' && (
          <div>
            <label className="block text-sm font-medium mb-2">Chave de Licença</label>
            <input
              type="text"
              value={formData.licenseKey}
              onChange={(e) => setFormData({...formData, licenseKey: e.target.value})}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua chave de licença"
            />
          </div>
        )}
        
        <button
          className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={handleSubmit}
        >
          {step === 'license' ? 'Continuar' : 'Finalizar Instalação'}
        </button>
      </div>
    </div>
  );
}