import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTodos, createTodo, toggleTodo, deleteTodo } from './api/todoApi'
import { Todo } from './types/todo'
import './App.css'

function App() {
  const [newTodo, setNewTodo] = useState('')
  const queryClient = useQueryClient()

  const { data: todos = [], isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos
  })

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

  return (
    <div className="app">
      <h1>Todo List</h1>
      
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
    </div>
  )
}

export default App