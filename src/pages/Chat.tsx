import React, { useState, useEffect } from 'react';
import { GraduationCap, GitFork, Brain, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavigationMenu } from '../components/NavigationMenu';
import { ChatParticipants } from '../components/chat/ChatParticipants';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatInput } from '../components/chat/ChatInput';
import { signalRService } from '../services/signalRService';
import ChatSetup, { ChatSettings } from './ChatSetup';
import type { ChatMessage, ChatParticipant } from '../types/chat';

type ChatType = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  participants: ChatParticipant[];
  inDevelopment?: boolean;
};

const CHAT_TYPES: ChatType[] = [
  {
    id: 'student',
    icon: <GraduationCap className="w-8 h-8" />,
    title: 'Студент с мудрецом',
    description: 'Задавайте вопросы и получайте знания от опытного специалиста',
    participants: [
      {
        id: 'mentor',
        name: 'Мудрец',
        role: 'Наставник',
        isOnline: true
      }
    ],
    inDevelopment: true
  },
  {
    id: 'discussion',
    icon: <GitFork className="w-8 h-8" />,
    title: 'Дискуссия специалистов',
    description: 'Наблюдайте за дискуссией экспертов с разными точками зрения',
    participants: [
      {
        id: 'expert1',
        name: 'Эксперт 1',
        role: 'Теоретик',
        isOnline: true
      },
      {
        id: 'expert2',
        name: 'Эксперт 2',
        role: 'Практик',
        isOnline: true
      }
    ],
    inDevelopment: true
  },
  {
    id: 'brainstorm',
    icon: <Brain className="w-8 h-8" />,
    title: 'Мозговой штурм',
    description: 'Участвуйте в генерации идей вместе с тремя AI-агентами',
    participants: [
      {
        id: 'creative',
        name: 'Креативщик',
        role: 'Генератор идей',
        isOnline: true
      },
      {
        id: 'analyst',
        name: 'Аналитик',
        role: 'Критическое мышление',
        isOnline: true
      },
      {
        id: 'pragmatic',
        name: 'Прагматик',
        role: 'Практическая реализация',
        isOnline: true
      }
    ],
    inDevelopment: true
  }
];

function Chat() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ChatType | null>(null);
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const currentUser: ChatParticipant = {
    id: 'user',
    name: 'Вы',
    role: 'Пользователь',
    isOnline: true
  };

  useEffect(() => {
    if (selectedType && chatSettings) {
      const connect = async () => {
        await signalRService.connect(selectedType.id);
        setIsConnected(true);
        setParticipants([currentUser, ...selectedType.participants]);
      };
      connect();

      const messageUnsubscribe = signalRService.onMessage((message) => {
        if (!isPaused) {
          setMessages(prev => [...prev, message]);
        }
      });

      const participantsUnsubscribe = signalRService.onParticipantsUpdate((updatedParticipants) => {
        setParticipants(updatedParticipants);
      });

      return () => {
        messageUnsubscribe();
        participantsUnsubscribe();
        signalRService.disconnect();
        setIsConnected(false);
      };
    }
  }, [selectedType, chatSettings, isPaused]);

  const handleSendMessage = async (content: string) => {
    if (isConnected && !isPaused) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        content,
        sender: currentUser,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      await signalRService.sendMessage(content);
    }
  };

  const handleStartChat = (settings: ChatSettings) => {
    setChatSettings(settings);
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleDeleteMessage = async (messageId: string) => {
    setMessageToDelete(messageId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!messageToDelete) return;

    // Сначала удаляем сообщение визуально
    setMessages(prev => prev.filter(msg => msg.id !== messageToDelete));

    // Затем отправляем запрос на сервер
    try {
      await signalRService.deleteMessage(messageToDelete);
    } catch (error) {
      console.error('Failed to delete message:', error);
      // В случае ошибки можно восстановить сообщение
      // setMessages(prev => [...prev, deletedMessage]);
    }

    setShowDeleteDialog(false);
    setMessageToDelete(null);
  };

  if (!selectedType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        <NavigationMenu />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <header className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Интеллектуальный чат</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">Выберите формат диалога</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CHAT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => !type.inDevelopment && setSelectedType(type)}
                disabled={type.inDevelopment}
                className={`relative p-8 rounded-xl transition-all duration-200 text-left ${
                  selectedType?.id === type.id
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : type.inDevelopment
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:shadow-md'
                }`}
              >
                {type.inDevelopment && (
                  <div className="absolute top-4 right-4 flex items-center text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">В разработке</span>
                  </div>
                )}
                <div className={`mb-6 ${
                  selectedType?.id === type.id 
                    ? 'text-white' 
                    : type.inDevelopment
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {type.icon}
                </div>
                <h2 className="text-xl font-semibold mb-3">{type.title}</h2>
                <p className={`text-sm ${
                  selectedType?.id === type.id 
                    ? 'text-blue-100' 
                    : type.inDevelopment
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!chatSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        <NavigationMenu onBack={() => setSelectedType(null)} />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <ChatSetup
            chatType={selectedType}
            onBack={() => setSelectedType(null)}
            onStart={handleStartChat}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu onBack={() => {
        setSelectedType(null);
        setChatSettings(null);
      }} />
      <div className="h-[calc(100vh-96px)] flex">
        <ChatParticipants participants={participants} />
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          <ChatMessages 
            messages={messages} 
            currentUserId={currentUser.id}
            onDeleteMessage={handleDeleteMessage}
          />
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
          />
        </div>
      </div>

      {/* Диалог подтверждения удаления */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center mb-4 text-red-500">
              <AlertCircle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">Подтверждение удаления</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Вы уверены, что хотите удалить это сообщение?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setMessageToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;