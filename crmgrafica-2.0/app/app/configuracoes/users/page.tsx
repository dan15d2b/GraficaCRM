'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Shield, AlertCircle } from 'lucide-react';
import { PERMISSION_MATRIX, type Role } from '@/lib/permissions';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'atendimento' as Role });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.success) setUsers(data.users);
  }

  async function createUser() {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    if (data.success) {
      setUsers([...users, data.user]);
      setShowForm(false);
      setNewUser({ name: '', email: '', role: 'atendimento' });
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
          <p className="text-slate-500 mt-1">Gerencie acessos e perfis</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novo Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <input type="text" placeholder="Nome completo" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input type="email" placeholder="E-mail" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})} className="px-4 py-2 border rounded-lg">
                <option value="admin">Administrador</option>
                <option value="producao">Produção</option>
                <option value="financeiro">Financeiro</option>
                <option value="atendimento">Atendimento</option>
                <option value="vendas">Vendas</option>
              </select>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={createUser} className="bg-blue-600">Salvar</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {user.name[0]}
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                user.role === 'producao' ? 'bg-blue-100 text-blue-700' :
                user.role === 'financeiro' ? 'bg-green-100 text-green-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {user.role}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Perfis de Acesso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {(Object.keys(PERMISSION_MATRIX) as Role[]).map((role) => (
              <div key={role} className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-medium text-sm">{role.charAt(0).toUpperCase() + role.slice(1)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
