import { useState, useRef, useEffect } from 'react';
import { Calendar, Tag, AlertCircle, Trash2, MoveRight } from 'lucide-react';
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
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<QuadrantType | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleDragStart = (todoId: string) => {
    if (isUpdating) return;
    setDraggedTodoId(todoId);
  };

  const handleDragEnd = () => {
    setDraggedTodoId(null);
    setActiveDropZone(null);
  };

  const handleDragEnter = (quadrantId: QuadrantType) => {
    setActiveDropZone(quadrantId);
  };

  const handleDrop = (targetQuadrant: QuadrantType) => {
    if (!draggedTodoId || isUpdating) return;

    const draggedTodo = todos.find(t => t.id === draggedTodoId);
    if (!draggedTodo) return;

    const currentQuadrant = categorizeTodo(draggedTodo);
    if (currentQuadrant === targetQuadrant) {
      handleDragEnd();
      return;
    }

    setIsUpdating(true);

    // Create updated todo with new properties
    const updatedTodo = { ...draggedTodo };

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

    // Clean up drag state immediately
    handleDragEnd();
    
    // Update localStorage
    updateTodo(updatedTodo);
    
    // Refresh data and allow new drags after a short delay
    setTimeout(() => {
      onUpdate();
      setIsUpdating(false);
      toast.success('Task moved successfully');
    }, 50);
  };

  const handleMoveTodo = (todoId: string, targetQuadrant: QuadrantType) => {
    if (isUpdating) return;

    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const currentQuadrant = categorizeTodo(todo);
    if (currentQuadrant === targetQuadrant) {
      toast.info('Task is already in this quadrant');
      return;
    }

    setIsUpdating(true);

    const updatedTodo = { ...todo };

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
    
    setTimeout(() => {
      onUpdate();
      setIsUpdating(false);
      toast.success('Task moved successfully');
    }, 50);
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
          const isDropTarget = activeDropZone === quadrant.id;
          const isDragging = draggedTodoId !== null;

          return (
            <div
              key={quadrant.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDragEnter(quadrant.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDrop(quadrant.id);
              }}
              className={`bg-gradient-to-br ${quadrant.color} border-2 ${quadrant.borderColor} rounded-xl p-4 min-h-[300px] transition-all duration-200 ${
                isDropTarget
                  ? 'ring-4 ring-white/50 scale-[1.02] shadow-2xl'
                  : ''
              } ${isDragging && !isDropTarget ? 'opacity-60 scale-[0.98]' : ''}`}
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
                    {isDropTarget ? 'Drop here' : 'No tasks in this quadrant'}
                  </div>
                ) : (
                  quadrantTodos.map(todo => (
                    <KanbanCard
                      key={todo.id}
                      todo={todo}
                      onDragStart={() => handleDragStart(todo.id)}
                      onDragEnd={handleDragEnd}
                      onDelete={() => handleDeleteTodo(todo.id, todo.title)}
                      onMove={handleMoveTodo}
                      isUrgent={isTaskUrgent(todo)}
                      isDragging={draggedTodoId === todo.id}
                      quadrants={quadrants}
                      currentQuadrant={quadrant.id}
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
          <strong>Tip:</strong> Drag and drop tasks between quadrants or use the move button to reorganize them. The system will automatically adjust priority and due dates.
        </p>
      </div>
    </div>
  );
}

interface KanbanCardProps {
  todo: Todo;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDelete: () => void;
  onMove: (todoId: string, targetQuadrant: QuadrantType) => void;
  isUrgent: boolean;
  isDragging: boolean;
  quadrants: Quadrant[];
  currentQuadrant: QuadrantType;
}

function KanbanCard({ todo, onDragStart, onDragEnd, onDelete, onMove, isUrgent, isDragging, quadrants, currentQuadrant }: KanbanCardProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoveMenu(false);
      }
    };

    if (showMoveMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoveMenu]);

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
        e.stopPropagation();
        onDragStart();
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onDragEnd();
      }}
      className={`bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-3 cursor-move transition-all ${
        isDragging
          ? 'opacity-30 scale-95'
          : 'hover:scale-105 hover:shadow-lg hover:border-opacity-70'
      } ${showMoveMenu ? 'relative z-50' : 'relative z-0'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm flex-1">{todo.title}</h4>
        <div className="flex gap-1 flex-shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu(!showMoveMenu);
              }}
              className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
              title="Move to"
            >
              <MoveRight className="w-4 h-4" />
            </button>
            
            {showMoveMenu && (
              <div className="absolute right-0 top-8 z-[100] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl min-w-[200px] py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700">
                  Move to
                </div>
                {quadrants.map((quadrant) => (
                  <button
                    key={quadrant.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(todo.id, quadrant.id);
                      setShowMoveMenu(false);
                    }}
                    disabled={quadrant.id === currentQuadrant}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      quadrant.id === currentQuadrant
                        ? 'text-gray-500 cursor-not-allowed bg-gray-700/50'
                        : 'text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{quadrant.title}</div>
                    <div className="text-xs text-gray-400">{quadrant.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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