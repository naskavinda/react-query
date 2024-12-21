/**
 * Main Todo Application Component
 * This component implements a Todo list with infinite scrolling using React Query.
 * Features include:
 * - Fetching todos with infinite scroll pagination
 * - Adding new todos
 * - Toggling todo completion status
 * - Deleting todos
 *
 *
 */

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { createTodo, deleteTodo, getTodos, toggleTodo } from "./api/todoApi";
import "./App.css";
import { Todo } from "./types/todo";

/**
 * This component is the main entry point for the Todo application.
 * It handles the rendering of the Todo list, form for adding new todos, and infinite scrolling.
 */
function App() {
  // State for new todo input
  const [newTodo, setNewTodo] = useState("");
  // Query client instance for managing cache
  const queryClient = useQueryClient();

  const { ref, inView } = useInView();

  /**
   * Infinite Query hook for fetching todos
   * - Handles pagination
   * - Manages loading and error states
   * - Provides methods for fetching next pages
   */
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["todos"],
    queryFn: getTodos,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  /**
   * Mutation hook for creating new todos
   * Invalidates todos query on success to refresh the list
   */
  const createTodoMutation = useMutation({
    mutationFn: (title: string) => createTodo({ title, userId: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setNewTodo("");
    },
  });

  /**
   * Mutation hook for toggling todo completion status
   * Invalidates todos query on success to refresh the list
   */
  const toggleTodoMutation = useMutation({
    mutationFn: toggleTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  /**
   * Mutation hook for deleting todos
   * Invalidates todos query on success to refresh the list
   */
  const deleteTodoMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  /**
   * Form submit handler for creating new todos
   * Prevents empty todos from being created
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    createTodoMutation.mutate(newTodo);
  };

  // Loading and error states handling
  if (status === "pending") return <div>Loading...</div>;
  if (status === "error") return <div>Error: {(error as Error).message}</div>;

  // Flatten todos from all pages into a single array
  const todos = data?.pages.flatMap((page) => page.todos) ?? [];

  // Debug logging for pagination state
  console.log("Current data:", {
    pagesCount: data?.pages.length,
    todosCount: todos.length,
    hasNextPage,
    isFetchingNextPage,
  });

  return (
    <div className="app">
      <h1>Todo List ({todos.length} items)</h1>

      <form onSubmit={handleSubmit} className="add-todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add new todo"
          className="todo-input"
        />
        <button type="submit" className="add-button">
          Add Todo
        </button>
      </form>

      <ul className="todo-list">
        {todos.map((todo: Todo) => (
          <li key={todo.id} className="todo-item">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodoMutation.mutate(todo)}
            />
            <span
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
              {todo.title}
            </span>
            <button
              onClick={() => deleteTodoMutation.mutate(todo.id)}
              className="delete-button"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <div ref={ref}>
        {isFetchingNextPage
          ? "Loading more..."
          : hasNextPage
          ? "Load More"
          : "Nothing more to load"}
      </div>
      <div>{isFetching && !isFetchingNextPage ? "Fetching..." : null}</div>
    </div>
  );
}

export default App;
