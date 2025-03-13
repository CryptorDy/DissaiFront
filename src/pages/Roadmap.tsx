import React, { useState } from 'react';
import { NavigationMenu } from '../components/NavigationMenu';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { useGeneration } from '../context/GenerationContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { roadmapApi } from '../services/api';

function Roadmap() {
  const navigate = useNavigate();
  const { addTask, removeTask, updateTask, canAddTask } = useGeneration();
  const { showSuccess, showError } = useToast();
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [detailLevel, setDetailLevel] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!goal || !deadline) {
      showError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (!canAddTask) {
      showError('Достигнут лимит параллельных задач. Дождитесь завершения текущих задач.');
      return;
    }

    setIsLoading(true);
    const taskId = addTask('roadmap', `Roadmap: ${goal}`);

    if (!taskId) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await roadmapApi.generate({
        goal,
        deadline,
        detailLevel
      });
      
      if (!data.content) {
        throw new Error('Нет данных от API');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(data.content);
        
        if (!parsedData.goal || !Array.isArray(parsedData.tasks)) {
          throw new Error('Некорректная структура данных');
        }
      } catch (e) {
        console.error('Error parsing API response:', e);
        throw new Error('Ошибка при обработке ответа от сервера');
      }
      
      updateTask(taskId, { 
        status: 'completed', 
        progress: 100,
        result: parsedData
      });
      removeTask(taskId);
      
      showSuccess('Roadmap успешно создан');
      
    } catch (error) {
      console.error('Error generating roadmap:', error);
      updateTask(taskId, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Ошибка при создании roadmap' 
      });
      showError(error instanceof Error ? error.message : 'Произошла ошибка при создании roadmap');
      removeTask(taskId);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingAnimation withNavigation />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Генерация Roadmap</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Составьте план достижения ваших целей</p>
        </header>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Опишите вашу цель
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Например: Хочу стать full-stack разработчиком..."
                  className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Реализовать до
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Уровень детализации
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Общий</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={detailLevel}
                    onChange={(e) => setDetailLevel(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Детальный</span>
                  <span className="w-8 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    {detailLevel}
                  </span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!goal || !deadline || !canAddTask}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {!canAddTask ? 'Достигнут лимит задач' : 'Сгенерировать план'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Roadmap;