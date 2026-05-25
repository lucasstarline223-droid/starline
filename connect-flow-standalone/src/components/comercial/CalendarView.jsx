import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarRange, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, getDay, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarView({ prospects, onItemClick }) {
  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const getProspectsForDate = (date) => {
    return prospects.filter(prospect => {
      if (!prospect.data_reuniao_ae) return false;
      try {
        const prospectDate = parseISO(prospect.data_reuniao_ae);
        return prospectDate.getDate() === date.getDate() &&
               prospectDate.getMonth() === date.getMonth() &&
               prospectDate.getFullYear() === date.getFullYear();
      } catch {
        return false;
      }
    });
  };

  const getDisplayDays = () => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      return [currentDate];
    }
  };

  const getHeaderText = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(weekStart, 'dd MMM', { locale: ptBR })} - ${format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}`;
    } else {
      return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  const displayDays = getDisplayDays();
  const firstDayOfWeek = viewMode === 'month' ? getDay(startOfMonth(currentDate)) : 0;
  const emptyDaysStart = viewMode === 'month' ? (firstDayOfWeek === 0 ? 0 : firstDayOfWeek) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={goToPrevious} 
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 capitalize">
            {getHeaderText()}
          </h2>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('month')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'month'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Mês"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Semana"
            >
              <CalendarRange className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Dia"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <button 
          onClick={goToNext} 
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Weekday Headers */}
      {viewMode !== 'day' && (
        <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'} gap-2 mb-3`}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} gap-2`}>
        {/* Empty cells before first day (month view only) */}
        {viewMode === 'month' && Array.from({ length: emptyDaysStart }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Calendar days */}
        {displayDays.map((day, index) => {
          const dayProspects = getProspectsForDate(day);
          const isTodayDay = isToday(day);
          const dayNumber = format(day, 'd');

          return (
            <div
              key={index}
              className={`${viewMode === 'day' ? 'min-h-[500px]' : 'aspect-square'} rounded-lg border transition-all relative flex flex-col p-3
                ${isTodayDay ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <div className={`${viewMode === 'day' ? 'text-2xl' : 'text-lg'} font-semibold mb-2 ${isTodayDay ? 'text-blue-600' : 'text-gray-900'}`}>
                {viewMode === 'day' ? format(day, "EEEE, dd 'de' MMMM", { locale: ptBR }) : dayNumber}
              </div>
              
              {dayProspects.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-2">
                  {viewMode === 'day' ? (
                    dayProspects.map(prospect => (
                      <div
                        key={prospect.id}
                        onClick={() => onItemClick(prospect)}
                        className="bg-blue-50 border border-blue-200 p-3 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                      >
                        <div className="font-semibold text-blue-900">{prospect.nome_empresa}</div>
                        {prospect.nome_contato && (
                          <div className="text-sm text-blue-700 mt-1">{prospect.nome_contato}</div>
                        )}
                        {prospect.segmento && (
                          <div className="text-xs text-blue-600 mt-1">{prospect.segmento}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="w-full h-1 rounded-full bg-blue-500 mb-1" />
                      <div className="space-y-0.5">
                        {dayProspects.slice(0, viewMode === 'week' ? 3 : 2).map(prospect => (
                          <div
                            key={prospect.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemClick(prospect);
                            }}
                            className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
                            title={prospect.nome_empresa}
                          >
                            {prospect.nome_empresa}
                          </div>
                        ))}
                        {dayProspects.length > (viewMode === 'week' ? 3 : 2) && (
                          <div className="text-xs text-gray-500 font-medium">
                            +{dayProspects.length - (viewMode === 'week' ? 3 : 2)}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : viewMode === 'day' ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma reunião agendada</p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}