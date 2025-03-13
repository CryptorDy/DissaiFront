import { ChatMessage, ChatParticipant } from '../types/chat';

class SignalRService {
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private participantCallbacks: ((participants: ChatParticipant[]) => void)[] = [];
  private isConnected = false;
  private currentChatId: string | null = null;
  private mockResponses: { [key: string]: string[] } = {
    'student': [
      '**Интересный вопрос!** Давайте разберем его подробнее:\n\n1. Первый аспект\n2. Второй аспект\n3. Третий аспект',
      'В этом контексте важно понимать следующее:\n\n- Ключевой момент\n- Важная деталь\n- Основной вывод',
      'Могу привести несколько примеров:\n\n```\nПример 1: ...\nПример 2: ...\nПример 3: ...\n```'
    ],
    'discussion': [
      'С **теоретической** точки зрения, это явление можно объяснить так:\n\n> Важная цитата или определение\n\nДалее рассмотрим практическое применение...',
      'На практике мы часто сталкиваемся с другим подходом. Например:\n\n1. Первый случай\n2. Второй случай\n\nЧто думаете об этом?',
      'Позвольте предложить *альтернативный* взгляд на эту проблему:\n\n- Плюсы: ...\n- Минусы: ...\n- Возможные решения: ...'
    ],
    'brainstorm': [
      '🎯 Давайте рассмотрим это с творческой стороны:\n\n1. **Идея**: ...\n2. **Реализация**: ...\n3. **Результат**: ...',
      '📊 Анализируя данные, можно прийти к следующему выводу:\n\n```\nСтатистика:\n- Показатель 1: ...\n- Показатель 2: ...\n```',
      '💡 С точки зрения реализации, предлагаю следующее решение:\n\n1. Этап 1\n2. Этап 2\n3. Этап 3'
    ]
  };

  async connect(chatId: string) {
    this.currentChatId = chatId;
    this.isConnected = true;
    
    setTimeout(() => {
      const sender = this.getAIParticipant(chatId);
      if (sender) {
        this.messageCallbacks.forEach(callback => callback({
          id: Date.now().toString(),
          content: '👋 **Здравствуйте!** Я готов помочь вам в обсуждении.\n\nВы можете использовать *markdown* для форматирования сообщений.',
          sender,
          timestamp: new Date()
        }));
      }
    }, 1000);
  }

  async disconnect() {
    this.isConnected = false;
    this.currentChatId = null;
  }

  async sendMessage(content: string) {
    if (!this.isConnected || !this.currentChatId) return;

    setTimeout(() => {
      const responses = this.mockResponses[this.currentChatId!];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const sender = this.getAIParticipant(this.currentChatId!);
      
      if (sender) {
        this.messageCallbacks.forEach(callback => callback({
          id: Date.now().toString(),
          content: randomResponse,
          sender,
          timestamp: new Date()
        }));
      }
    }, 1000 + Math.random() * 2000);
  }

  async deleteMessage(messageId: string) {
    // В реальном приложении здесь был бы запрос к серверу
    // Для демонстрации просто возвращаем Promise
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onParticipantsUpdate(callback: (participants: ChatParticipant[]) => void) {
    this.participantCallbacks.push(callback);
    return () => {
      this.participantCallbacks = this.participantCallbacks.filter(cb => cb !== callback);
    };
  }

  private getAIParticipant(chatId: string): ChatParticipant | null {
    switch (chatId) {
      case 'student':
        return {
          id: 'mentor',
          name: 'Мудрец',
          role: 'Наставник',
          isOnline: true
        };
      case 'discussion':
        return {
          id: Math.random() > 0.5 ? 'expert1' : 'expert2',
          name: Math.random() > 0.5 ? 'Эксперт 1' : 'Эксперт 2',
          role: Math.random() > 0.5 ? 'Теоретик' : 'Практик',
          isOnline: true
        };
      case 'brainstorm':
        const roles = [
          {
            id: 'creative',
            name: 'Креативщик',
            role: 'Генератор идей'
          },
          {
            id: 'analyst',
            name: 'Аналитик',
            role: 'Критическое мышление'
          },
          {
            id: 'pragmatic',
            name: 'Прагматик',
            role: 'Практическая реализация'
          }
        ];
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        return {
          ...randomRole,
          isOnline: true
        };
      default:
        return null;
    }
  }
}

export const signalRService = new SignalRService();