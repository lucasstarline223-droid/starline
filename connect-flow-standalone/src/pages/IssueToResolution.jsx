import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, Phone, MessageSquare, AlertTriangle, ArchiveX, LayoutGrid, AlignJustify } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TriagemTab from '@/components/chamados/TriagemTab';
import SuportePabxTab from '@/components/chamados/SuportePabxTab';
import SuporteWhatsAppTab from '@/components/chamados/SuporteWhatsAppTab';
import WarRoomTab from '@/components/chamados/WarRoomTab';
import EncerradosTab from '@/components/chamados/EncerradosTab';

const PABX_NIVEIS = ['N1 - Suporte', 'N2 - Avançado', 'N3 - Especialista', 'Visita Presencial'];
const WA_NIVEIS = ['N1 - WhatsApp', 'N2 - Avançado', 'N3 - Especialista', 'Visita Presencial'];

export default function IssueToResolution() {
  const [activeTab, setActiveTab] = useState('triagem');

  const { data: chamados = [] } = useQuery({
    queryKey: ['chamados'],
    queryFn: () => base44.entities.Chamado.list('-created_date')
  });

  const ativos = chamados.filter(c => !['Resolvido', 'Fechado'].includes(c.status));

  const isWhatsAppChamado = (c) => {
    if (c.tipo_suporte === 'N1 - WhatsApp') return true;
    const primeiroNivel = (c.historico_acoes || [])[0]?.nivel;
    return primeiroNivel === 'N1 - WhatsApp';
  };

  const isPabxChamado = (c) => !isWhatsAppChamado(c) && PABX_NIVEIS.includes(c.tipo_suporte);

  const countPabx = ativos.filter(isPabxChamado).length;
  const countWa = ativos.filter(isWhatsAppChamado).length;
  const countTriagem = ativos.filter(c => c.tipo_suporte === 'Triagem' || !c.tipo_suporte).length;
  const countWarRoom = ativos.filter(c => c.tipo_suporte === 'War Room').length;

  const [viewMode, setViewMode] = useState('compact');

  return (
    <div className="p-6 bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Chamados</h1>
            <p className="text-gray-600 mt-1">Gestão de suporte e resolução de problemas</p>
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 mt-1">
            <button
              onClick={() => setViewMode('compact')}
              title="Visualização compacta"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'compact' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('expanded')}
              title="Visualização expandida"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'expanded' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {[
              { key: 'triagem', label: 'Triagem', icon: ClipboardCheck, color: 'indigo', count: countTriagem },
              { key: 'pabx', label: 'Suporte PABX/Voz', icon: Phone, color: 'blue', count: countPabx },
              { key: 'whatsapp', label: 'API/WhatsApp', icon: MessageSquare, color: 'green', count: countWa },
              { key: 'warroom', label: 'War Room', icon: AlertTriangle, color: 'red', count: countWarRoom },
              { key: 'encerrados', label: 'Encerrados', icon: ArchiveX, color: 'gray', count: null },
            ].map(({ key, label, icon: Icon, color, count }) => {
              const isActive = activeTab === key;
              const colorMap = {
                indigo: isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600',
                blue:   isActive ? 'bg-blue-600 text-white border-blue-600 shadow-md'   : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600',
                green:  isActive ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600',
                red:    isActive ? 'bg-red-600 text-white border-red-600 shadow-md'     : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600',
                gray:   isActive ? 'bg-gray-700 text-white border-gray-700 shadow-md'   : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800',
              };
              const badgeMap = {
                indigo: isActive ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-700',
                blue:   isActive ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-700',
                green:  isActive ? 'bg-white/25 text-white' : 'bg-green-100 text-green-700',
                red:    isActive ? 'bg-white/25 text-white' : 'bg-red-100 text-red-700',
                gray:   isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700',
              };
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${colorMap[color]}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {count != null && count > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${badgeMap[color]}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <TabsContent value="triagem" className="mt-6">
            <TriagemTab viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="pabx" className="mt-6">
            <SuportePabxTab viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-6">
            <SuporteWhatsAppTab viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="warroom" className="mt-6">
            <WarRoomTab viewMode={viewMode} />
          </TabsContent>



          <TabsContent value="encerrados" className="mt-6">
            <EncerradosTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}