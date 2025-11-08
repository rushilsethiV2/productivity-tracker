import { useState, DragEvent } from 'react';
import { Calendar, Tag, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Todo } from '../types';
import { updateTodo, deleteTodo } from '../services/todoService';

interface KanbanBoardProps {
  todos: Todo[];
  onUpdate: () => void;
}

type QuadrantType = 'urgent-important' | 'urgent-not-important' | 'not-urgent-important' | 'not-urgent-not-important';

interface Quadrant {
  id: QuadrantType;
  title: string;
  description: string;
  color: string;
  borderColor: string;
}

export default function KanbanBoard({ todos, onUpdate }: KanbanBoardProps) {
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<QuadrantType | null>(null);

  const quadrants: Quadrant[] = [
    {
      id: 'urgent-important',
      title: 'Urgent & Important',
      description: 'Do First',
      color: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500',
    },
    {
      id: 'urgent-not-important',
      title: 'Urgent, Not Important',
      description: 'Schedule',
      color: 'from-orange-500/20 to-yellow-500/20',
      borderColor: 'border-orange-500',
    },
    {
      id: 'not-urgent-important',
      title: 'Not Urgent, Important',
      description: 'Plan',
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500',
    },
    {
      id: 'not-urgent-not-important',
      title: 'Not Urgent, Not Important',
      description: 'Eliminate',
      color: 'from-gray-500/20 to-gray-600/20',
      borderColor: 'border-gray-500',
    },
  ];

  const categorizeTodo = (todo: Todo): QuadrantType => {
    const isUrgent = isTaskUrgent(todo);
    const isImportant = todo.priority === 'high' || todo.priority === 'medium';

    if (isUrgent && isImportant) return 'urgent-important';
    if (isUrgent && !isImportant) return 'urgent-not-important';
    if (!isUrgent && isImportant) return 'not-urgent-important';
    return 'not-urgent-not-important';
  };

  const isTaskUrgent = (todo: Todo): boolean => {
    if (!todo.dueDate) return false;

    const dueDate = new Date(todo.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 2;
  };

  const getTodosForQuadrant = (quadrantId: QuadrantType): Todo[] => {
    return todos.filter(todo => !todo.completed && categorizeTodo(todo) === quadrantId);
  };

  const handleDragStart = (e: DragEvent, todo: Todo) => {
    setDraggedTodo(todo);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.currentTarget as any);
    }
  };

  const handleDragOver = (e: DragEvent, quadrantId: QuadrantType) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    setDragOverQuadrant(quadrantId);
  };

  const handleDragLeave = (e: DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e as any).clientX;
    const y = (e as any).clientY;

    if (x < rect.left - 10 || x > rect.right + 10 || y < rect.top - 10 || y > rect.bottom + 10) {
      setDragOverQuadrant(null);
    }
  };

  const handleDrop = (e: DragEvent, targetQuadrant: QuadrantType) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTodo) {
      setDragOverQuadrant(null);
      setDraggedTodo(null);
      return;
    }

    const currentQuadrant = categorizeTodo(draggedTodo);
    if (currentQuadrant === targetQuadrant) {
      setDragOverQuadrant(null);
      setDraggedTodo(null);
      return;
    }

    let updatedTodo = { ...draggedTodo };

    switch (targetQuadrant) {
      case 'urgent-important':
        updatedTodo.priority = 'high';
        if (!updatedTodo.dueDate) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          updatedTodo.dueDate = tomorrow.toISOString().split('T')[0];
        }
        break;
      case 'urgent-not-important':
        updatedTodo.priority = 'low';
        if (!updatedTodo.dueDate) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          updatedTodo.dueDate = tomorrow.toISOString().split('T')[0];
        }
        break;
      case 'not-urgent-important':
        updatedTodo.priority = 'high';
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        updatedTodo.dueDate = nextWeek.toISOString().split('T')[0];
        break;
      case 'not-urgent-not-important':
        updatedTodo.priority = 'low';
        updatedTodo.dueDate = undefined;
        break;
    }

    updateTodo(updatedTodo);
    setDraggedTodo(null);
    setDragOverQuadrant(null);
    onUpdate();
    toast.success('Task moved successfully');
  };

  const handleDragEnd = () => {
    setDraggedTodo(null);
    setDragOverQuadrant(null);
  };

  const handleDeleteTodo = (id: string, title: string) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-semibold mb-3">Delete "{title}"?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteTodo(id);
                onUpdate();
                closeToast();
                toast.success('Task deleted successfully');
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              Delete
            </button>
            <button
              onClick={closeToast}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeButton: false,
        draggable: false,
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Task Matrix</h2>
          <p className="text-sm text-gray-400">Eisenhower Matrix - Organize by urgency and importance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map(quadrant => {
          const quadrantTodos = getTodosForQuadrant(quadrant.id);
          const isDropTarget = dragOverQuadrant === quadrant.id && draggedTodo;

          return (
            <div
              key={quadrant.id}
              onDragOver={(e) => handleDragOver(e, quadrant.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, quadrant.id)}
              className={`bg-gradient-to-br ${quadrant.color} border-2 ${quadrant.borderColor} rounded-xl p-4 min-h-[300px] transition-all duration-200 ${
                isDropTarget
                  ? 'ring-2 ring-offset-2 ring-offset-[rgb(var(--background))] scale-105'
                  : ''
              } ${draggedTodo && dragOverQuadrant !== quadrant.id ? 'opacity-50' : ''}`}
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-1">{quadrant.title}</h3>
                <p className="text-sm text-gray-400">{quadrant.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {quadrantTodos.length} {quadrantTodos.length === 1 ? 'task' : 'tasks'}
                </div>
              </div>

              <div className="space-y-3">
                {quadrantTodos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No tasks in this quadrant
                  </div>
                ) : (
                  quadrantTodos.map(todo => (
                    <KanbanCard
                      key={todo.id}
                      todo={todo}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDelete={handleDeleteTodo}
                      isUrgent={isTaskUrgent(todo)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-sm text-blue-300">
          <strong>Tip:</strong> Drag and drop tasks between quadrants to reorganize them. The system will automatically adjust priority and due dates.
        </p>
      </div>
    </div>
  );
}

interface KanbanCardProps {
  todo: Todo;
  onDragStart: (e: DragEvent, todo: Todo) => void;
  onDragEnd: () => void;
  onDelete: (id: string, title: string) => void;
  isUrgent: boolean;
}

function KanbanCard({ todo, onDragStart, onDragEnd, onDelete, isUrgent }: KanbanCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const priorityColors = {
    high: 'text-red-400 bg-red-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low: 'text-blue-400 bg-blue-500/20',
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart(e, todo);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      className={`bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-3 cursor-move transition-all hover:scale-105 hover:shadow-lg ${
        isDragging
          ? 'opacity-60 scale-95 border-dashed'
          : 'hover:border-opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm flex-1">{todo.title}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(todo.id, todo.title);
          }}
          className="flex-shrink-0 p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {todo.description && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{todo.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded ${priorityColors[todo.priority]}`}>
          {todo.priority}
        </span>
        <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
          <Tag className="w-3 h-3" />
          {todo.category}
        </span>
        {todo.dueDate && (
          <span
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
              isOverdue
                ? 'bg-red-500/20 text-red-400'
                : isUrgent
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {isOverdue && <AlertCircle className="w-3 h-3" />}
          </span>
        )}
      </div>
    </div>
  );
}
