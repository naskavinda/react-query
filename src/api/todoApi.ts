import { Todo, CreateTodoInput } from '../types/todo';

const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

export const getTodos = async (): Promise<Todo[]> => {
  const response = await fetch(`${API_BASE_URL}/todos`);
  if (!response.ok) {
    throw new Error('Failed to fetch todos');
  }
  return response.json();
};

export const createTodo = async (todo: CreateTodoInput): Promise<Todo> => {
  const response = await fetch(`${API_BASE_URL}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(todo),
  });
  if (!response.ok) {
    throw new Error('Failed to create todo');
  }
  console.log(response);
  return response.json();
};

export const toggleTodo = async (todo: Todo): Promise<Todo> => {
  const response = await fetch(`${API_BASE_URL}/todos/${todo.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completed: !todo.completed }),
  });
  if (!response.ok) {
    throw new Error('Failed to update todo');
  }
  return response.json();
};

export const deleteTodo = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete todo');
  }
};
