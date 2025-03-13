import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationMenu } from '../components/NavigationMenu';
import { useGeneration } from '../context/GenerationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, ArrowRight, Clock, Ban, Trash2 } from 'lucide-react';

function TaskProgress() {
  const navigate = useNavigate();
  const { tasks, cancelTask, clearCompletedTasks } = useGeneration();

  // Группируем задачи по статусу
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const failedTasks = tasks.filter(task => task.status === 'error');
  const cancelledTasks = tasks.filter(task => task.status === 'cancelled');

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

  // Форматируем время
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Вычисляем длительность задачи
  const getTaskDuration = (startedAt: number, completedAt?: number) => {
    const endTime = completedAt || Date.now();
    const duration = endTime - startedAt;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes} мин ${seconds % 60} сек`;
    }
    return `${seconds} сек`;
  };

  const hasCompletedOrCancelledTasks = completedTasks.length > 0 || cancelledTasks.length > 0 || failedTasks.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Задачи
          </h1>
          {hasCompletedOrCancelledTasks && (
            <button
              onClick={clearCompletedTasks}
              className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Очистить историю
            </button>
          )}
        </div>

        {/* Активные задачи */}
        {pendingTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              В процессе
            </h2>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {pendingTasks.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative mr-4">
                          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                          <motion.div
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
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </h3>
                          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-1" />
                            Начато в {formatTime(task.startedAt)}
                            <span className="mx-2">•</span>
                            {getTaskDuration(task.startedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {task.canCancel && (
                          <button
                            onClick={() => cancelTask(task.id)}
                            className="flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Отменить
                          </button>
                        )}
                        {task.progress > 0 && (
                          <div className="w-16 h-16 relative">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#E2E8F0"
                                strokeWidth="3"
                                className="dark:stroke-gray-700"
                              />
                              <path
                                d="M18 2.0845
                                  a 15.9155 15.9155 0 0 1 0 31.831
                                  a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="3"
                                strokeDasharray={`${task.progress}, 100`}
                                className="dark:stroke-blue-400"
                              />
                              <text
                                x="18"
                                y="20.35"
                                className="text-xs fill-gray-900 dark:fill-white font-medium"
                                textAnchor="middle"
                              >
                                {task.progress}%
                              </text>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Завершенные задачи */}
        {completedTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Завершенные
            </h2>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {completedTasks.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-4" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </h3>
                          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-1" />
                            Завершено в {formatTime(task.completedAt!)}
                            <span className="mx-2">•</span>
                            {getTaskDuration(task.startedAt, task.completedAt)}
                          </div>
                        </div>
                      </div>
                      {task.result && (
                        <button
                          onClick={() => {
                            const url = getResultUrl(task.type);
                            navigate(url, { state: task.result });
                          }}
                          className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          Посмотреть результат
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Отмененные задачи */}
        {cancelledTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Отмененные
            </h2>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {cancelledTasks.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-l-4 border-yellow-500"
                  >
                    <div className="flex items-center">
                      <Ban className="w-6 h-6 text-yellow-500 mr-4" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          Отменено в {formatTime(task.completedAt!)}
                          <span className="mx-2">•</span>
                          {getTaskDuration(task.startedAt, task.completedAt)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Ошибки */}
        {failedTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Ошибки
            </h2>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {failedTasks.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-l-4 border-red-500"
                  >
                    <div className="flex items-center">
                      <XCircle className="w-6 h-6 text-red-500 mr-4" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        {task.error && (
                          <p className="mt-1 text-sm text-red-500">
                            {task.error}
                          </p>
                        )}
                        <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTime(task.startedAt)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Нет активных задач
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskProgress;