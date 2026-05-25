import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import Header from '@/components/layout/Header';
import { 
  LayoutDashboard,
  Users,
  Target, 
  TrendingUp, 
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Star,
  Search,
  Target as TargetIcon,
  Headphones,
  BarChart3,
  DollarSign,
  Boxes,
  UserCircle,
  Lightbulb,
  Scale,
  Folder,
  Building2,
  Menu,
  X,
  FileText,
  AlertCircle,
  Rocket,
  LifeBuoy,
  UserMinus,
  XCircle,
  Package
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState(['comercial']);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => { loadUser(); }, []);
  useEffect(() => { if (user) loadFavorites(); }, [user]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const favs = await base44.entities.UserFavorite.filter({ user_email: user.email });
      setFavorites(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (pageName) => {
    try {
      const existing = favorites.find(f => f.page_name === pageName);
      if (existing) {
        await base44.entities.UserFavorite.delete(existing.id);
        setFavorites(favorites.filter(f => f.id !== existing.id));
      } else {
        const newFav = await base44.entities.UserFavorite.create({
          page_name: pageName,
          user_email: user.email,
          order: favorites.length
        });
        setFavorites([...favorites, newFav]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isFavorite = (pageName) => favorites.some(f => f.page_name === pageName);

  const menuStructure = [
    { id: 'favoritos', name: 'Favoritos', icon: Star, color: 'text-yellow-500', children: [] },
    {
      id: 'comercial', name: 'Comercial & CRM', icon: TargetIcon, color: 'text-green-500',
      children: [
        { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
        { name: 'Painel SDR', page: 'SdrDashboard', icon: Target },
        { name: 'Leads', page: 'Leads', icon: Users },
        { name: 'Prospects', page: 'Prospects', icon: Target },
        { name: 'Oportunidades', page: 'Oportunidades', icon: TrendingUp },
        { name: 'Handoff', page: 'Handoff', icon: ClipboardCheck }
      ]
    },
    {
      id: 'operacoes', name: 'Operações & Suporte', icon: Headphones, color: 'text-orange-500',
      children: [
        { name: 'Ordem de Ativação', page: 'OrderToActivation', icon: Rocket },
        { name: 'Gestão de Chamados', page: 'IssueToResolution', icon: LifeBuoy },
        { name: 'Cancelamentos', page: 'Cancelamentos', icon: XCircle }
      ]
    },
    {
      id: 'estoque', name: 'Estoque', icon: Package, color: 'text-teal-500',
      children: [{ name: 'Controle de Estoque', page: 'Estoque', icon: Package }]
    },
    {
      id: 'revops', name: 'RevOps & Analytics', icon: BarChart3, color: 'text-blue-500',
      children: [
        { name: 'Clientes', page: 'Clientes', icon: Building2 },
        { name: 'Contatos', page: 'Contatos', icon: UserCircle },
        { name: 'Números DID/DDR', page: 'NumerosDID', icon: Search },
        { name: 'Fornecedores', page: 'Fornecedores', icon: Building2 }
      ]
    },
    {
      id: 'financeiro', name: 'Financeiro', icon: DollarSign, color: 'text-emerald-500',
      children: [
        { name: 'Contratos', page: 'Contratos', icon: FileText },
        { name: 'Dunning & Cobranças', page: 'DunningCobrancas', icon: AlertCircle }
      ]
    },
    {
      id: 'produto', name: 'Produto & Automação', icon: Boxes, color: 'text-amber-500',
      children: [
        { name: 'Planos & Serviços', page: 'PlanosServicos', icon: Boxes },
        { name: 'Addons', page: 'Addons', icon: Boxes },
        { name: 'Produtos & SKUs', page: 'ProdutosSKUs', icon: Boxes }
      ]
    },
    { id: 'pessoas', name: 'Pessoas & RH', icon: UserCircle, color: 'text-purple-500', locked: true, children: [] },
    { id: 'gestao', name: 'Gestão & Estratégia', icon: Lightbulb, color: 'text-pink-500', locked: true, children: [] },
    { id: 'juridico', name: 'Jurídico & Compliance', icon: Scale, color: 'text-indigo-500', locked: true, children: [] },
    { id: 'projetos', name: 'Projetos & Iniciativas', icon: Folder, color: 'text-red-500', children: [] },
    { id: 'patrimonio', name: 'Patrimônio & Facilities', icon: Building2, color: 'text-cyan-500', locked: true, children: [] }
  ];

  const toggleMenu = (menuId) => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
      setExpandedMenus([menuId]);
    } else {
      setExpandedMenus(prev =>
        prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
      );
    }
  };

  const allPages = menuStructure.flatMap(menu => menu.children || []);
  const favoritePages = allPages.filter(page => isFavorite(page.page));

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen && (
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Espaços</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Search */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuStructure.map((menu) => {
            const Icon = menu.icon;
            const isExpanded = expandedMenus.includes(menu.id);
            const hasChildren = menu.children && menu.children.length > 0;

            if (menu.id === 'favoritos') {
              return (
                <div key={menu.id}>
                  <button
                    onClick={() => toggleMenu(menu.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-yellow-50 flex-shrink-0">
                        <Icon className={`w-4 h-4 ${menu.color}`} />
                      </div>
                      {sidebarOpen && (
                        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm truncate">{menu.name}</span>
                      )}
                    </div>
                    {sidebarOpen && favoritePages.length > 0 && (
                      <div className="flex-shrink-0 ml-1">
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-gray-400" />
                          : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>
                    )}
                  </button>

                  {isExpanded && sidebarOpen && favoritePages.length > 0 && (
                    <div className="mt-1 ml-6 space-y-1">
                      {favoritePages.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = currentPageName === item.page;
                        return (
                          <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg transition-all group ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ItemIcon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="text-xs font-medium truncate">{item.name}</span>
                            </div>
                            <Star
                              className="w-3 h-3 fill-yellow-400 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.page); }}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {isExpanded && sidebarOpen && favoritePages.length === 0 && (
                    <div className="mt-1 ml-6 px-3 py-2 text-xs text-gray-400">
                      Nenhum favorito ainda
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={menu.id}>
                <button
                  onClick={() => hasChildren && toggleMenu(menu.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                    hasChildren ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer' : 'cursor-default'
                  } ${menu.locked ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg ${menu.color.replace('text-', 'bg-').replace('500', '50')} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${menu.color}`} />
                    </div>
                    {sidebarOpen && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm truncate">{menu.name}</span>
                        {menu.locked && (
                          <span className="text-xs text-gray-400 flex-shrink-0">🔒</span>
                        )}
                      </div>
                    )}
                  </div>
                  {sidebarOpen && hasChildren && (
                    <div className="flex-shrink-0 ml-1">
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        : <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                    </div>
                  )}
                </button>

                {isExpanded && sidebarOpen && hasChildren && (
                  <div className="mt-1 ml-6 space-y-1">
                    {menu.children.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = currentPageName === item.page;
                      const isFav = isFavorite(item.page);
                      return (
                        <Link
                          key={item.page}
                          to={createPageUrl(item.page)}
                          className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg transition-all group ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ItemIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs font-medium truncate">{item.name}</span>
                          </div>
                          <Star
                            className={`w-3 h-3 transition-opacity cursor-pointer flex-shrink-0 ${
                              isFav
                                ? 'fill-yellow-400 text-yellow-400 opacity-100'
                                : 'text-gray-300 opacity-0 group-hover:opacity-100'
                            }`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.page); }}
                          />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Sistema de Gestão Comercial
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto dark:bg-[#111827] dark:text-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}