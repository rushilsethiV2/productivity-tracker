import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Filter, Tag, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Todo } from '../types';
import { loadTodos, saveTodos, addTodo, updateTodo, deleteTodo, getCategories } from '../services/todoService';

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    refreshTodos();
  }, []);

  const refreshTodos = () => {
    const loadedTodos = loadTodos();
    setTodos(loadedTodos);
    const cats = getCategories();
    setCategories(cats);
  };

  const handleAddTodo = (todo: Todo) => {
    addTodo(todo);
    refreshTodos();
    setShowAddModal(false);
  };

  const handleToggleTodo = (todo: Todo) => {
    const updated = {
      ...todo,
      completed: !todo.completed,
      completedAt: !todo.completed ? new Date().toISOString() : undefined,
    };
    updateTodo(updated);
    refreshTodos();
  };

  const handleDeleteTodo = (id: string) => {
    deleteTodo(id);
    refreshTodos();
  };

  const filteredTodos = todos.filter(todo => {
    if (filterCategory !== 'all' && todo.category !== filterCategory) return false;
    if (filterPriority !== 'all' && todo.priority !== filterPriority) return false;
    if (filterStatus === 'active' && todo.completed) return false;
    if (filterStatus === 'completed' && !todo.completed) return false;
    return true;
  });

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  };

  return (
    <div className="min-h-screen p-6 pb-24 pl-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                Todo List
              </h1>
              <p className="text-gray-400">Organize your tasks efficiently</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Todo
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-blue-400">{stats.total}</p>
            </div>
            <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Active</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.active}</p>
            </div>
            <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-400">{stats.completed}</p>
            </div>
          </div>

          <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="font-semibold">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-3">
          {sortedTodos.length === 0 ? (
            <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-12 text-center">
              <p className="text-gray-400">No tasks found. Add your first todo to get started!</p>
            </div>
          ) : (
            sortedTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
              />
            ))
          )}
        </div>

        {showAddModal && (
          <AddTodoModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddTodo}
            existingCategories={categories}
          />
        )}
      </div>
    </div>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (id: string) => void;
}) {
  const priorityColors = {
    high: 'text-red-400 bg-red-500/20 border-red-500',
    medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500',
    low: 'text-blue-400 bg-blue-500/20 border-blue-500',
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  return (
    <div
      className={`bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4 transition-all hover:border-yellow-500/50 ${
        todo.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(todo)}
          className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
            todo.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-600 hover:border-yellow-500'
          }`}
        >
          {todo.completed && <Check className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3
              className={`text-lg font-semibold ${
                todo.completed ? 'line-through text-gray-500' : ''
              }`}
            >
              {todo.title}
            </h3>
            <button
              onClick={() => onDelete(todo.id)}
              className="flex-shrink-0 p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {todo.description && (
            <p className="text-gray-400 text-sm mb-3">{todo.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
              <Tag className="w-3 h-3" />
              {todo.category}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded border ${
                priorityColors[todo.priority]
              }`}
            >
              {todo.priority} priority
            </span>
            {todo.dueDate && (
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  isOverdue
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                <CalendarIcon className="w-3 h-3" />
                {new Date(todo.dueDate).toLocaleDateString()}
                {isOverdue && <AlertCircle className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTodoModal({
  onClose,
  onAdd,
  existingCategories,
}: {
  onClose: () => void;
  onAdd: (todo: Todo) => void;
  existingCategories: string[];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [useNewCategory, setUseNewCategory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim()) return;

    const todo: Todo = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim(),
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined,
    };

    onAdd(todo);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Add New Todo</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description..."
                rows={3}
                className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              {existingCategories.length > 0 && !useNewCategory ? (
                <div className="space-y-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setUseNewCategory(true)}
                    className="text-sm text-yellow-400 hover:text-yellow-300"
                  >
                    + Create new category
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Enter category name..."
                    className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500"
                    required
                  />
                  {existingCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUseNewCategory(false)}
                      className="text-sm text-yellow-400 hover:text-yellow-300"
                    >
                      Use existing category
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-4 rounded-lg border transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : p === 'medium'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                          : 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'border-[rgb(var(--border))] hover:border-yellow-500'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Due Date (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[rgb(var(--background))] border border-[rgb(var(--border))] hover:border-gray-500 py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-3 rounded-lg transition-all font-semibold"
            >
              Add Todo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
