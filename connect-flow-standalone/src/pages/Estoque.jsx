import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, Users, ShoppingCart } from 'lucide-react';
import EstoqueGeralTab from '@/components/estoque/EstoqueGeralTab';
import EstoqueTecnicosTab from '@/components/estoque/EstoqueTecnicosTab';
import RequisicaoCompraTab from '@/components/estoque/RequisicaoCompraTab';

const TABS = [
  { key: 'geral', label: 'Estoque Geral', icon: Package },
  { key: 'tecnicos', label: 'Estoque Técnicos', icon: Users },
  { key: 'requisicoes', label: 'Requisições de Compra', icon: ShoppingCart }
];

export default function Estoque() {
  const [tabAtiva, setTabAtiva] = useState('geral');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ['hardware'],
    queryFn: () => base44.entities.Hardware.list('-created_date')
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <Package className="w-7 h-7 text-blue-600" />
          Controle de Estoque
        </h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie equipamentos, transfira para técnicos e acompanhe alocações em clientes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = tabAtiva === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTabAtiva(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      {tabAtiva === 'geral' && (
        <EstoqueGeralTab itens={itens} isLoading={isLoading} isAdmin={isAdmin} />
      )}
      {tabAtiva === 'tecnicos' && (
        <EstoqueTecnicosTab isAdmin={isAdmin} />
      )}
      {tabAtiva === 'requisicoes' && (
        <RequisicaoCompraTab />
      )}
    </div>
  );
}