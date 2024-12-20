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
 * A[Component Mounts] --> B[useEffect Runs]
 * B --> C[Get loadMoreRef.current]
 * C --> D{Element Exists?}
 * D -->|Yes| E[Create Observer]
 * E --> F[Start Observing Element]
 * D -->|No| G[Return Early]
 * H[Component Updates] --> |If handleObserver changes| I[Cleanup Old Observer]
 * I --> B
 * J[Component Unmounts] --> K[Disconnect Observer]
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTodos, createTodo, toggleTodo, deleteTodo } from './api/todoApi'
import { Todo } from './types/todo'
import './App.css'

/**
 * Todo Application Component
 * This component is the main entry point for the Todo application.
 * It handles the rendering of the Todo list, form for adding new todos, and infinite scrolling.
 */
function App() {
  // State for new todo input
  const [newTodo, setNewTodo] = useState('')
  // Query client instance for managing cache
  const queryClient = useQueryClient()
  // Ref for intersection observer target element
  const loadMoreRef = useRef<HTMLDivElement>(null)

  /**
   * Infinite Query hook for fetching todos
   * - Handles pagination
   * - Manages loading and error states
   * - Provides methods for fetching next pages
   */
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
    getNextPageParam: (lastPage) => {
      console.log('Last page data:', lastPage)
      return lastPage.nextPage
    },
    initialPageParam: 1
  })

  /**
   * Intersection Observer callback
   * Triggers next page fetch when the load more element becomes visible
   */
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0]
    console.log('Intersection:', {
      isIntersecting: target.isIntersecting,
      hasNextPage,
      isFetchingNextPage
    })
    
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      console.log('Fetching next page...')
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  /**
   * Effect hook to setup Intersection Observer
   * Creates and cleanup observer for infinite scrolling functionality
   */
  useEffect(() => {
    // 1. Get the DOM element reference
    const element = loadMoreRef.current;

    // 2. Safety check
    if (!element) return;

    // 3. Intersection Observer options
    const options = {
      root: null, // Use viewport as root
      rootMargin: "0px", // No margin around root
      threshold: 0.1, // Trigger when 10% of element is visible
    };

    // 4. Create and setup observer
    const observer = new IntersectionObserver(handleObserver, options);
    observer.observe(element);

    // 5. Cleanup function
    return () => observer.disconnect();
  }, [handleObserver])

  /**
   * Mutation hook for creating new todos
   * Invalidates todos query on success to refresh the list
   */
  const createTodoMutation = useMutation({
    mutationFn: (title: string) => createTodo({ title, userId: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setNewTodo('')
    },
  })

  /**
   * Mutation hook for toggling todo completion status
   * Invalidates todos query on success to refresh the list
   */
  const toggleTodoMutation = useMutation({
    mutationFn: toggleTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  /**
   * Mutation hook for deleting todos
   * Invalidates todos query on success to refresh the list
   */
  const deleteTodoMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  /**
   * Form submit handler for creating new todos
   * Prevents empty todos from being created
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return
    createTodoMutation.mutate(newTodo)
  }

  // Loading and error states handling
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {(error as Error).message}</div>

  // Flatten todos from all pages into a single array
  const todos = data?.pages.flatMap(page => page.todos) ?? []

  // Debug logging for pagination state
  console.log('Current data:', {
    pagesCount: data?.pages.length,
    todosCount: todos.length,
    hasNextPage,
    isFetchingNextPage
  })

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
        <button type="submit" className="add-button">Add Todo</button>
      </form>

      <div className="todo-container">
        <ul className="todo-list">
          {todos.map((todo: Todo) => (
            <li key={todo.id} className="todo-item">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodoMutation.mutate(todo)}
              />
              <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
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

        <div 
          ref={loadMoreRef}
          className="load-more"
          style={{ 
            padding: '20px',
            textAlign: 'center',
            marginTop: '10px'
          }}
        >
          {isFetchingNextPage ? (
            <div>Loading more todos...</div>
          ) : hasNextPage ? (
            <div>Scroll to load more</div>
          ) : (
            <div>No more todos to load</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App