import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, ArrowRight, XCircle, Ban } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';
import { useLocation, useNavigate } from 'react-router-dom';

export function GenerationStatus() {
  const { tasks, cancelTask } = useGeneration();
  const location = useLocation();
  const navigate = useNavigate();

  // Показываем статус только на главной странице
  if (location.pathname !== '/') return null;

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed' && task.showResult);

  // Если нет задач для отображения, не показываем компонент
  if (pendingTasks.length === 0 && completedTasks.length === 0) {
    return null;
  }

  // Получаем URL для перехода в зависимости от типа задачи
  const getResultUrl = (type: string) => {
    switch (type) {
      case 'roadmap':
        return '/roadmap/result';
      case 'reels':
        return '/articles/reels/result';
      default:
        return '/';
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <motion.div
        key="generation-status-container"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg rounded-2xl px-6 py-3"
      >
        <div className="flex items-center space-x-4">
          {pendingTasks.length > 0 ? (
            <>
              <div className="relative">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <motion.div
                  key="loader-ring"
                  className="absolute inset-0 rounded-full border-2 border-blue-500/30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <div className="flex flex-col space-y-2">
                {pendingTasks.map((task, index) => (
                  <motion.div
                    key={`task-${task.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-2"
                  >
                    <button
                      onClick={() => navigate('/tasks')}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {task.title}
                    </button>
                    {task.canCancel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelTask(task.id);
                        }}
                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        title="Отменить задачу"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <AnimatePresence mode="wait">
              {completedTasks.map((task) => (
                <motion.div
                  key={`completed-${task.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-3"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <button
                    onClick={() => navigate('/tasks')}
                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {task.title}
                  </button>
                  {task.status === 'completed' && task.result && (
                    <button
                      onClick={() => {
                        const url = getResultUrl(task.type);
                        navigate(url, { state: task.result });
                      }}
                      className="flex items-center px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      Посмотреть результат
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}