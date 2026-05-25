import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

export default function KanbanBoard({ 
  columns, 
  items, 
  onStatusChange, 
  onItemClick,
  renderCard,
  statusField = 'status'
}) {
  const getColumnItems = (status) => {
    return items.filter(item => item[statusField] === status);
  };

  const getColumnColor = (status) => {
    const colors = {
      'em_qualificacao': 'border-gray-400',
      'em_contato': 'border-purple-500',
      'qualificado': 'border-blue-500',
      'descartado': 'border-red-500',
      'convertido': 'border-green-500'
    };
    return colors[status] || 'border-gray-400';
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    // Se moveu para a mesma coluna, não fazer nada
    if (source.droppableId === destination.droppableId) return;
    
    const item = items.find(i => i.id === draggableId);
    if (!item) return;
    
    // Atualizar o status do item
    if (onStatusChange) {
      onStatusChange(item, destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {columns.map((column, index) => {
          const columnItems = getColumnItems(column.value);
          
          return (
            <div
              key={column.value}
              className="flex-shrink-0 w-80"
            >
              {/* Column Header */}
              <div className={`bg-white rounded-xl p-4 mb-3 border-t-4 ${getColumnColor(column.value)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{column.label}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {columnItems.length} {columnItems.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Cards Container */}
              <Droppable droppableId={column.value}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] transition-colors rounded-xl ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {columnItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => !snapshot.isDragging && onItemClick && onItemClick(item)}
                            className={`cursor-pointer ${snapshot.isDragging ? 'opacity-70' : ''}`}
                          >
                            {renderCard(item)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {columnItems.length === 0 && (
                      <div className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-200 text-center">
                        <p className="text-sm text-gray-400">Nenhum item</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}