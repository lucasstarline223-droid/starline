import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, User as UserIcon, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function UserSelect({ value, onChange, placeholder = "Selecionar usuário" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [localValue, setLocalValue] = useState(value);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => { setLocalValue(value); }, [value]);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 500)
  });

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find(u => u.email === localValue);

  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [updateDropdownPosition]);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => { updateDropdownPosition(); setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
      >
        {selectedUser ? (
          <div className="flex items-center gap-2">
            {selectedUser.profile_picture ? (
              <img
                src={selectedUser.profile_picture}
                alt={selectedUser.full_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {getInitials(selectedUser.full_name)}
              </div>
            )}
            <span className="text-sm text-gray-900">{selectedUser.full_name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <UserIcon className="w-4 h-4" />
            <span className="text-sm">{placeholder}</span>
          </div>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div ref={dropdownRef} style={dropdownStyle} className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="pl-9 text-sm"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setLocalValue(user.email);
                  onChange(user.email, user.full_name);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                  value === user.email ? 'bg-blue-50' : ''
                }`}
              >
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {getInitials(user.full_name)}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}