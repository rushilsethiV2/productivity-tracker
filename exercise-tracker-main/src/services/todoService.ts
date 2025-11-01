import { Todo } from '../types';

const TODOS_KEY = 'app_todos';

export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

export function loadTodos(): Todo[] {
  const data = localStorage.getItem(TODOS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addTodo(todo: Todo): void {
  const todos = loadTodos();
  todos.push(todo);
  saveTodos(todos);
}

export function updateTodo(updatedTodo: Todo): void {
  const todos = loadTodos();
  const index = todos.findIndex(t => t.id === updatedTodo.id);
  if (index !== -1) {
    todos[index] = updatedTodo;
    saveTodos(todos);
  }
}

export function deleteTodo(id: string): void {
  const todos = loadTodos();
  const filtered = todos.filter(t => t.id !== id);
  saveTodos(filtered);
}

export function getTodoById(id: string): Todo | undefined {
  const todos = loadTodos();
  return todos.find(t => t.id === id);
}

export function getTodosByCategory(category: string): Todo[] {
  const todos = loadTodos();
  if (category === 'all') return todos;
  return todos.filter(t => t.category === category);
}

export function getTodosByPriority(priority: string): Todo[] {
  const todos = loadTodos();
  if (priority === 'all') return todos;
  return todos.filter(t => t.priority === priority);
}

export function getCategories(): string[] {
  const todos = loadTodos();
  const categories = new Set(todos.map(t => t.category));
  return Array.from(categories);
}
