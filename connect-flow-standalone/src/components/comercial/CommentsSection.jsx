import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function CommentsSection({ comments = [], onAddComment, currentUser }) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newComment.trim()) return;

    const comment = {
      conteudo: newComment,
      autor_email: currentUser?.email || '',
      autor_nome: currentUser?.full_name || currentUser?.email || 'Usuário',
      data: new Date().toISOString(),
      tipo_autor: currentUser?.role === 'admin' ? 'Gerente' : 'SDR'
    };

    onAddComment(comment);
    setNewComment('');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAutorColor = (tipo) => {
    const colors = {
      'Gerente': 'bg-purple-100 text-purple-700',
      'SDR': 'bg-blue-100 text-blue-700',
      'Vendedor': 'bg-green-100 text-green-700',
      'AI Agent': 'bg-orange-100 text-orange-700'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <MessageSquare className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Histórico de Qualificação</h3>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum comentário ainda</p>
            <p className="text-xs">Adicione observações sobre o processo de qualificação</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div key={index} className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {getInitials(comment.autor_nome)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900">
                    {comment.autor_nome}
                  </span>
                  {comment.tipo_autor && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getAutorColor(comment.tipo_autor)}`}>
                      {comment.tipo_autor}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.data), "dd/MM/yyyy 'às' HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                  {comment.conteudo}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="pt-3 border-t border-gray-200">
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione observações sobre necessidades, dores, interesses..."
            className="min-h-[80px] resize-none"
          />
        </div>
        <div className="flex justify-end mt-2">
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Adicionar Comentário
          </Button>
        </div>
      </form>
    </div>
  );
}