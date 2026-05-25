import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Mail, Phone, Building2, Star, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ContactModal from '@/components/comercial/ContactModal';
import ImportarContatosModal from '@/components/comercial/ImportarContatosModal';

export default function Contatos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [initialData, setInitialData] = useState({});
  const queryClient = useQueryClient();

  // Ler parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('empresa')) {
      setInitialData({
        empresa: params.get('empresa') || '',
        nome: params.get('nome') || '',
        email: params.get('email') || '',
        telefone: params.get('telefone') || '',
        cargo: params.get('cargo') || ''
      });
      setIsModalOpen(true);
      // Limpar URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
    }
  });

  const handleDelete = (contact, e) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o contato ${contact.nome}?`)) {
      deleteMutation.mutate(contact.id);
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCargoColor = (cargo) => {
    const colors = {
      'Diretor': 'bg-purple-100 text-purple-700',
      'Gerente': 'bg-blue-100 text-blue-700',
      'CEO/Proprietário': 'bg-red-100 text-red-700',
      'Coordenador': 'bg-green-100 text-green-700',
      'TI': 'bg-cyan-100 text-cyan-700',
      'Financeiro': 'bg-emerald-100 text-emerald-700'
    };
    return colors[cargo] || 'bg-gray-100 text-gray-700';
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contatos</h1>
            <p className="text-gray-600 mt-1">{filteredContacts.length} contatos no sistema</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar CSV
            </Button>
            <Button 
              onClick={() => {
                setSelectedContact(null);
                setInitialData({});
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Contato
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, email, empresa..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  onClick={() => {
                    setSelectedContact(contact);
                    setInitialData({});
                    setIsModalOpen(true);
                  }}
                  className="hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {contact.nome?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{contact.nome}</span>
                          {contact.principal && (
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span>{contact.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {contact.cargo && (
                      <Badge className={`${getCargoColor(contact.cargo)} border`}>
                        {contact.cargo}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {contact.empresa && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{contact.empresa}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {contact.telefone && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{contact.telefone}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Ativo
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => handleDelete(contact, e)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Excluir contato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum contato encontrado</p>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <ImportarContatosModal
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => queryClient.invalidateQueries(['contacts'])}
        />
      )}

      {/* Modal */}
      <ContactModal
        contact={selectedContact}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContact(null);
          setInitialData({});
        }}
        initialData={initialData}
      />
    </div>
  );
}