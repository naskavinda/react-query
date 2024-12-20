import { useState, useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTodos, createTodo, toggleTodo, deleteTodo } from './api/todoApi'
import { Todo } from './types/todo'
import './App.css'

function App() {
  const [newTodo, setNewTodo] = useState('')
  const queryClient = useQueryClient()
  const loadMoreRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const element = loadMoreRef.current
    
    if (!element) return
    
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }

    const observer = new IntersectionObserver(handleObserver, options)
    observer.observe(element)

    return () => observer.disconnect()
  }, [handleObserver])

  const createTodoMutation = useMutation({
    mutationFn: (title: string) => createTodo({ title, userId: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setNewTodo('')
    },
  })

  const toggleTodoMutation = useMutation({
    mutationFn: toggleTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const deleteTodoMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return
    createTodoMutation.mutate(newTodo)
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {(error as Error).message}</div>

  const todos = data?.pages.flatMap(page => page.todos) ?? []

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