import { Todo, CreateTodoInput } from '../types/todo';

const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

export const getTodos = async ({ pageParam = 1 }) => {
  const limit = 10;
  const response = await fetch(
    `${API_BASE_URL}/todos?_page=${pageParam}&_limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch todos');
  }

  const totalCount = response.headers.get('x-total-count');
  const hasNextPage = totalCount && pageParam * limit < parseInt(totalCount);
  
  console.log('hasNextPage', hasNextPage);
  const data = await response.json();
  
  return {
    todos: data,
    hasNextPage: hasNextPage,
    nextCursor: hasNextPage ? pageParam + 1 : undefined,
  };
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
