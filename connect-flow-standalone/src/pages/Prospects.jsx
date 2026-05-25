import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, LayoutGrid, List, CalendarDays, BarChart3, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KanbanBoard from '../components/comercial/KanbanBoard';
import ProspectCard from '../components/comercial/ProspectCard';
import ProspectModal from '../components/comercial/ProspectModal';
import ProspectDetailModal from '../components/comercial/ProspectDetailModal';
import ContactModal from '../components/comercial/ContactModal';
import CalendarView from '../components/comercial/CalendarView';
import ActivityModal from '../components/comercial/ActivityModal';
import ActivitiesDashboard from '../components/comercial/ActivitiesDashboard';
import QuickScheduleModal from '../components/comercial/QuickScheduleModal';
import DealModal from '../components/comercial/DealModal';

export default function Prospects() {
  const [viewMode, setViewMode] = useState('kanban');
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [newDealInitialData, setNewDealInitialData] = useState(null);
  const [pendingConvertProspect, setPendingConvertProspect] = useState(null);
  const [contactInitialData, setContactInitialData] = useState({});
  const [activityData, setActivityData] = useState({ entityId: '', entityType: '', entityName: '', preSelectedType: '' });
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => base44.entities.Prospect.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Prospect.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Prospect.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
    }
  });

  const linkDealToProspectMutation = useMutation({
    mutationFn: ({ prospectId, dealId, dealNome }) =>
      base44.entities.Prospect.update(prospectId, { deal_id: dealId, deal_nome: dealNome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    }
  });

  const calculateScoreMutation = useMutation({
    mutationFn: async (prospectId) => {
      return base44.functions.invoke('calculateProspectScore', { prospect_id: prospectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
    }
  });

  const calculateAllScoresMutation = useMutation({
    mutationFn: async () => {
      const promises = prospects.map(p => 
        base44.functions.invoke('calculateProspectScore', { prospect_id: p.id }).catch(err => ({ error: err }))
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
    }
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleStatusChange = async (prospect, newStatus) => {
    if (newStatus === 'convertido') {
      // 1. Marcar como convertido
      await base44.entities.Prospect.update(prospect.id, { status: 'convertido' });
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      // 2. Guardar prospect e abrir DealModal pré-preenchido
      setPendingConvertProspect(prospect);
      setNewDealInitialData({
        nome_empresa: prospect.nome_empresa || '',
        site_empresa: prospect.site_empresa || '',
        segmento: prospect.segmento || '',
        tamanho_empresa: prospect.tamanho_empresa || '',
        data_apresentacao: prospect.data_reuniao_ae || '',
        account_executive: '',
        status: 'qualificacao_ae',
        tipo_oportunidade: 'Nova venda'
      });
      setIsDealModalOpen(true);
    } else {
      updateStatusMutation.mutate({ id: prospect.id, status: newStatus });
    }
  };

  const handleDealSaveSuccess = (savedDeal) => {
    if (pendingConvertProspect && savedDeal?.id) {
      linkDealToProspectMutation.mutate({
        prospectId: pendingConvertProspect.id,
        dealId: savedDeal.id,
        dealNome: savedDeal.nome_empresa
      });
    }
    setPendingConvertProspect(null);
    setNewDealInitialData(null);
  };

  const columns = [
    { label: 'Em Qualificação', value: 'em_qualificacao' },
    { label: 'Em Contato (MQL)', value: 'em_contato' },
    { label: 'Qualificado (SQL)', value: 'qualificado' },
    { label: 'Descartado', value: 'descartado' },
    { label: 'Convertido', value: 'convertido' }
  ];

  const handleItemClick = (prospect) => {
    setSelectedProspect(prospect);
    setIsDetailModalOpen(true);
  };

  const handleEditProspect = (prospect) => {
    setSelectedProspect(prospect);
    setIsModalOpen(true);
  };

  const handleNewProspect = () => {
    setSelectedProspect(null);
    setIsModalOpen(true);
  };

  const handleAddContact = (data) => {
    setContactInitialData(data);
    setIsContactModalOpen(true);
  };

  const handleRegisterActivity = (prospect, activityType) => {
    setActivityData({
      entityId: prospect.id,
      entityType: 'Prospect',
      entityName: prospect.nome_empresa || 'Sem nome',
      preSelectedType: activityType
    });
    setIsActivityModalOpen(true);
  };

  const handleScheduleMeeting = (prospect) => {
    setSelectedProspect(prospect);
    setIsScheduleModalOpen(true);
  };

  const getScoreColor = (score) => {
    if (!score) return 'bg-gray-100 text-gray-700';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-blue-100 text-blue-700';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status) => {
    const colors = {
      'em_qualificacao': 'bg-gray-100 text-gray-700',
      'em_contato': 'bg-purple-100 text-purple-700',
      'qualificado': 'bg-blue-100 text-blue-700',
      'descartado': 'bg-red-100 text-red-700',
      'convertido': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prospects</h1>
            <p className="text-gray-600 mt-1">{prospects.length} prospects no pipeline</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'dashboard'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              </div>

            <Button
              onClick={() => calculateAllScoresMutation.mutate()}
              disabled={calculateAllScoresMutation.isPending}
              variant="outline"
              className="rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {calculateAllScoresMutation.isPending ? 'Calculando...' : 'Calcular Scores IA'}
            </Button>

            <Button
              onClick={handleNewProspect}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Prospect
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            columns={columns}
            items={prospects}
            onStatusChange={handleStatusChange}
            onItemClick={handleItemClick}
            renderCard={(prospect) => <ProspectCard prospect={prospect} onDelete={handleDelete} onEdit={handleEditProspect} onAddContact={handleAddContact} onRegisterActivity={handleRegisterActivity} />}
          />
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Segmento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tamanho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SDR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Score IA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prospects.map((prospect) => (
                  <tr
                    key={prospect.id}
                    onClick={() => handleItemClick(prospect)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{prospect.nome_empresa}</div>
                      {prospect.site_empresa && (
                        <div className="text-xs text-blue-600">{prospect.site_empresa}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{prospect.nome_contato}</div>
                      <div className="text-xs text-gray-500">{prospect.email_contato}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{prospect.segmento}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{prospect.tamanho_empresa}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(prospect.status)}`}>
                        {prospect.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prospect.sdr}</td>
                    <td className="px-6 py-4">
                      {prospect.score_ia ? (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${getScoreColor(prospect.score_ia)}`}>
                          <TrendingUp className="w-3 h-3" />
                          {Math.round(prospect.score_ia)}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            calculateScoreMutation.mutate(prospect.id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Calcular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView prospects={prospects} onItemClick={handleItemClick} />
        ) : (
          <ActivitiesDashboard />
        )}
        </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <ProspectModal
          prospect={selectedProspect}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProspect(null);
          }}
        />
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && (
        <ProspectDetailModal
          prospect={selectedProspect}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedProspect(null);
          }}
        />
      )}

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setContactInitialData({});
        }}
        initialData={contactInitialData}
      />

      {/* Activity Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setActivityData({ entityId: '', entityType: '', entityName: '', preSelectedType: '' });
        }}
        entityId={activityData.entityId}
        entityType={activityData.entityType}
        entityName={activityData.entityName}
        preSelectedType={activityData.preSelectedType}
        user={user}
      />

      {/* Deal Modal - criado ao converter prospect */}
      {isDealModalOpen && (
        <DealModal
          deal={null}
          isOpen={isDealModalOpen}
          initialData={newDealInitialData}
          onSaveSuccess={handleDealSaveSuccess}
          onClose={() => {
            setIsDealModalOpen(false);
            setPendingConvertProspect(null);
            setNewDealInitialData(null);
          }}
        />
      )}

      {/* Schedule Meeting Modal */}
      <QuickScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedProspect(null);
        }}
        prospect={selectedProspect}
      />
      </div>
      );
      }