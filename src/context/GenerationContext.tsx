import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GenerationTask, GenerationType } from '../types/generation';
import { useToast } from './ToastContext';

interface GenerationContextType {
  tasks: GenerationTask[];
  addTask: (type: GenerationType, title: string) => string | null;
  updateTask: (id: string, updates: Partial<GenerationTask>) => void;
  removeTask: (id: string) => void;
  cancelTask: (id: string) => void;
  clearCompletedTasks: () => void;
  getTask: (id: string) => GenerationTask | undefined;
  hasPendingTasks: boolean;
  canAddTask: boolean;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

const STORAGE_KEY = 'generation_tasks';
const MAX_PARALLEL_TASKS = 2; // Максимальное количество параллельных задач
const COMPLETED_TASK_DISPLAY_TIME = 5000; // 5 секунд показа завершенной задачи

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const { showError, showSuccess } = useToast();
  const [tasks, setTasks] = useState<GenerationTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading generation tasks:', error);
    }
    return [];
  });

  // Проверяем, можно ли добавить новую задачу
  const pendingTasksCount = tasks.filter(task => task.status === 'pending').length;
  const canAddTask = pendingTasksCount < MAX_PARALLEL_TASKS;

  // Сохраняем задачи в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Мемоизируем функции, чтобы избежать лишних ререндеров
  const addTask = useCallback((type: GenerationType, title: string): string | null => {
    // Проверяем количество активных задач перед добавлением новой
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    if (pendingTasks.length >= MAX_PARALLEL_TASKS) {
      showError(`Достигнут лимит параллельных задач (${MAX_PARALLEL_TASKS}). Дождитесь завершения текущих задач.`);
      return null;
    }

    const id = Date.now().toString();
    const newTask: GenerationTask = {
      id,
      type,
      title,
      status: 'pending',
      progress: 0,
      startedAt: Date.now(),
      showResult: false,
      canCancel: true
    };

    setTasks(prev => [...prev, newTask]);
    return id;
  }, [tasks, showError]);

  const updateTask = useCallback((id: string, updates: Partial<GenerationTask>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const updatedTask = { 
          ...task, 
          ...updates,
          completedAt: updates.status === 'completed' ? Date.now() : task.completedAt,
          showResult: updates.status === 'completed' ? true : task.showResult
        };
        
        // Если задача завершена, устанавливаем таймер для её скрытия
        if (updates.status === 'completed') {
          setTimeout(() => {
            setTasks(current => current.map(t => 
              t.id === id ? { ...t, showResult: false } : t
            ));
          }, COMPLETED_TASK_DISPLAY_TIME);
        }
        
        return updatedTask;
      }
      return task;
    }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const cancelTask = useCallback((id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id && task.status === 'pending') {
        showSuccess('Задача отменена');
        return {
          ...task,
          status: 'cancelled',
          completedAt: Date.now(),
          canCancel: false
        };
      }
      return task;
    }));
  }, [showSuccess]);

  const clearCompletedTasks = useCallback(() => {
    setTasks(prev => prev.filter(task => task.status === 'pending'));
    showSuccess('История задач очищена');
  }, [showSuccess]);

  const getTask = useCallback((id: string) => {
    return tasks.find(task => task.id === id);
  }, [tasks]);

  const hasPendingTasks = tasks.some(task => task.status === 'pending');

  return (
    <GenerationContext.Provider value={{
      tasks,
      addTask,
      updateTask,
      removeTask,
      cancelTask,
      clearCompletedTasks,
      getTask,
      hasPendingTasks,
      canAddTask
    }}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (context === undefined) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return context;
}