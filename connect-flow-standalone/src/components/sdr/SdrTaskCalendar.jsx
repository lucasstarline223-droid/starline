import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SdrTaskModal from './SdrTaskModal';

export default function SdrTaskCalendar({ currentUser }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month'
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['sdrTasks', currentUser?.email],
    queryFn: () => base44.entities.SdrTask.filter({ sdr_responsavel: currentUser?.email }),
    enabled: !!currentUser?.email
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ taskId, currentStatus }) => {
      const newStatus = currentStatus === 'Concluída' ? 'Pendente' : 'Concluída';
      const updateData = { status: newStatus };
      if (newStatus === 'Concluída') {
        updateData.data_conclusao = new Date().toISOString().split('T')[0];
      }
      return base44.entities.SdrTask.update(taskId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sdrTasks']);
    }
  });

  const getDaysToShow = () => {
    if (viewMode === 'day') {
      return [currentDate];
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { locale: ptBR });
      const end = endOfWeek(currentDate, { locale: ptBR });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const monthStart = startOfWeek(start, { locale: ptBR });
      const monthEnd = endOfWeek(end, { locale: ptBR });
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
  };

  const getTasksForDate = (date) => {
    return tasks.filter(task => 
      task.data_vencimento && isSameDay(new Date(task.data_vencimento), date)
    );
  };

  const navigateDate = (direction) => {
    if (viewMode === 'day') {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const getPriorityColor = (prioridade) => {
    const colors = {
      'Urgente': 'bg-red-100 border-red-300 text-red-700',
      'Alta': 'bg-orange-100 border-orange-300 text-orange-700',
      'Média': 'bg-yellow-100 border-yellow-300 text-yellow-700',
      'Baixa': 'bg-blue-100 border-blue-300 text-blue-700'
    };
    return colors[prioridade] || 'bg-gray-100 border-gray-300 text-gray-700';
  };

  const getStatusIcon = (status) => {
    if (status === 'Concluída') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'Em Andamento') return <Clock className="w-4 h-4 text-blue-600" />;
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  const days = getDaysToShow();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Minhas Tarefas
          </h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mês
            </button>
          </div>
        </div>
        
        <Button
          onClick={() => {
            setSelectedTask(null);
            setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
            setShowTaskModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="text-lg font-semibold text-gray-900">
          {viewMode === 'day' && format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          {viewMode === 'week' && `${format(startOfWeek(currentDate, { locale: ptBR }), 'd MMM', { locale: ptBR })} - ${format(endOfWeek(currentDate, { locale: ptBR }), 'd MMM yyyy', { locale: ptBR })}`}
          {viewMode === 'month' && format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </div>
        
        <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
      )}

      <div className={`grid gap-2 ${
        viewMode === 'month' ? 'grid-cols-7' : 
        viewMode === 'week' ? 'grid-cols-7' : 
        'grid-cols-1'
      }`}>
        {days.map((day) => {
          const dayTasks = getTasksForDate(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          
          return (
            <div
              key={day.toISOString()}
              className={`border rounded-lg p-2 min-h-[100px] ${
                isToday(day) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
              } ${!isCurrentMonth && viewMode === 'month' ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${
                  isToday(day) ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {format(day, viewMode === 'month' ? 'd' : 'EEE d', { locale: ptBR })}
                </span>
                {(viewMode === 'day' || viewMode === 'week') && (
                  <button
                    onClick={() => {
                      setSelectedDate(format(day, 'yyyy-MM-dd'));
                      setSelectedTask(null);
                      setShowTaskModal(true);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Plus className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, viewMode === 'month' ? 2 : 10).map(task => (
                  <div
                    key={task.id}
                    className={`text-xs p-2 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getPriorityColor(task.prioridade)}`}
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          {getStatusIcon(task.status)}
                          <span className="font-medium truncate">{task.titulo}</span>
                        </div>
                        {task.prospect_nome && (
                          <div className="text-xs opacity-75 truncate">
                            {task.prospect_nome}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompleteMutation.mutate({ 
                            taskId: task.id, 
                            currentStatus: task.status 
                          });
                        }}
                        className="flex-shrink-0 p-1 hover:bg-white/50 rounded"
                      >
                        {task.status === 'Concluída' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-current rounded-full" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {dayTasks.length > (viewMode === 'month' ? 2 : 10) && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayTasks.length - (viewMode === 'month' ? 2 : 10)} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      <SdrTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
          setSelectedDate(null);
        }}
        task={selectedTask}
        defaultDate={selectedDate}
        currentUser={currentUser}
      />
    </div>
  );
}