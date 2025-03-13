import axios from 'axios';
import { API_URL } from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем перехватчик для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик для обработки 401 ошибки и преобразования ответов
api.interceptors.response.use(
  (response) => {
    // Преобразуем ключи из PascalCase в camelCase
    const transformResponse = (data: any): any => {
      if (Array.isArray(data)) {
        return data.map(transformResponse);
      }
      if (data === null || data === undefined || typeof data !== 'object') {
        return data;
      }

      // Нормализуем объект Reels, поддерживая оба формата
      if (data.VideoUrl || data.videoUrl) {
        return {
          inputUrl: data.InputUrl || data.inputUrl,
          caption: data.Caption || data.caption,
          transcription: data.Transcription || data.transcription,
          keyPoint: data.KeyPoint || data.keyPoint || data.KeyMessage || data.keyMessage,
          keyMessage: data.KeyMessage || data.keyMessage || data.KeyPoint || data.keyPoint,
          trigger: data.Trigger || data.trigger,
          hashtags: data.Hashtags || data.hashtags || [],
          mentions: data.Mentions || data.mentions || [],
          url: data.Url || data.url,
          commentsCount: data.CommentsCount || data.commentsCount || 0,
          latestComments: (data.LatestComments || data.latestComments || []).map((comment: any) => ({
            text: comment.Text || comment.text || '',
            ownerUsername: comment.OwnerUsername || comment.ownerUsername || '',
            timestamp: comment.Timestamp || comment.timestamp || '',
            repliesCount: comment.RepliesCount || comment.repliesCount || 0,
            likesCount: comment.LikesCount || comment.likesCount || 0,
            replies: comment.Replies || comment.replies || []
          })),
          videoUrl: data.VideoUrl || data.videoUrl,
          likesCount: data.LikesCount || data.likesCount || 0,
          videoViewCount: data.VideoViewCount || data.videoViewCount || 0,
          videoPlayCount: data.VideoPlayCount || data.videoPlayCount || 0,
          timestamp: data.Timestamp || data.timestamp || '',
          ownerFullName: data.OwnerFullName || data.ownerFullName || '',
          ownerUsername: data.OwnerUsername || data.ownerUsername || '',
          ownerId: data.OwnerId || data.ownerId || '',
          productType: data.ProductType || data.productType || '',
          videoDuration: data.VideoDuration || data.videoDuration || 0,
          isSponsored: Boolean(data.IsSponsored || data.isSponsored),
          musicInfo: {
            artist_name: data.MusicInfo?.ArtistName || data.musicInfo?.artistName || data.MusicInfo?.artist_name || data.musicInfo?.artist_name || '',
            song_name: data.MusicInfo?.SongName || data.musicInfo?.songName || data.MusicInfo?.song_name || data.musicInfo?.song_name || '',
            usesOriginalAudio: Boolean(data.MusicInfo?.UsesOriginalAudio || data.musicInfo?.usesOriginalAudio),
            shouldMuteAudio: Boolean(data.MusicInfo?.ShouldMuteAudio || data.musicInfo?.shouldMuteAudio),
            shouldMuteAudioReason: data.MusicInfo?.ShouldMuteAudioReason || data.musicInfo?.shouldMuteAudioReason || '',
            audioId: data.MusicInfo?.AudioId || data.musicInfo?.audioId || ''
          }
        };
      }
      
      return Object.keys(data).reduce((acc, key) => {
        // Преобразуем ключ в camelCase
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        let value = data[key];
        
        // Рекурсивно преобразуем вложенные объекты и массивы
        if (value !== null && typeof value === 'object') {
          value = transformResponse(value);
        }
        
        acc[camelKey] = value;
        return acc;
      }, {} as any);
    };

    if (response.data) {
      response.data = transformResponse(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication error (401):', error);
    }
    return Promise.reject(error);
  }
);

export interface KnowledgeItem {
  id: string;
  type: 'folder' | 'file';
  fileType?: 'article' | 'educational' | 'notes' | 'roadmap-item' | 'reels' | 'simplify' | 'chat' | 'content-plan';
  name: string;
  content?: string;
  children?: KnowledgeItem[];
  parentId?: string | null;
  metadata?: {
    completedTasks?: number[];
    [key: string]: any;
  };
}

interface MoveRequest {
  id: string;
  itemType: 'file' | 'folder';
  targetFolderId: string | null;
}

// Функция для безопасной сериализации объекта
const safeStringify = (obj: any): string => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
};

// Общий сервис для работы с базой знаний
export const knowledgeApi = {
  getItems: async (): Promise<KnowledgeItem[]> => {
    try {
      const response = await api.get('/knowledge');
      
      const transformItem = (item: any): KnowledgeItem => ({
        id: item.id || item.Id || '',
        type: (item.itemType || item.ItemType || 'folder').toLowerCase(),
        fileType: (item.fileType || item.FileType || '').toLowerCase(),
        name: item.name || item.Name || '',
        content: item.content || item.Content,
        children: item.children?.map(transformItem) || item.Children?.map(transformItem) || [],
        parentId: item.parentId || item.ParentId,
        metadata: item.metadata || item.Metadata
      });

      if ((response.data.itemType || response.data.ItemType) === 'folder' && !response.data.id && !response.data.Id) {
        return response.data.children?.map(transformItem) || response.data.Children?.map(transformItem) || [];
      }
      return [transformItem(response.data)];
    } catch (error) {
      console.error('Error fetching knowledge items:', error);
      throw error;
    }
  },

  getFile: async (id: string): Promise<KnowledgeItem> => {
    try {
      const response = await api.get(`/knowledge/file/${id}`);
      
      const transformItem = (item: any): KnowledgeItem => ({
        id: item.id || item.Id || '',
        type: (item.itemType || item.ItemType || 'file').toLowerCase(),
        fileType: (item.fileType || item.FileType || '').toLowerCase(),
        name: item.name || item.Name || '',
        content: item.content || item.Content,
        parentId: item.parentId || item.ParentId,
        metadata: item.metadata || item.Metadata
      });
      
      return transformItem(response.data);
    } catch (error) {
      console.error('Error fetching file:', error);
      throw error;
    }
  },

  saveItem: async (item: KnowledgeItem): Promise<KnowledgeItem> => {
    try {
      let safeContent = item.content;
      if (typeof safeContent === 'string' && (item.fileType === 'reels' || item.fileType === 'content-plan' || item.fileType === 'roadmap-item')) {
        safeContent = safeStringify(JSON.parse(safeContent));
      }

      const response = await api.post('/knowledge/save', {
        id: item.id,
        itemType: item.type.toUpperCase(),
        fileType: item.fileType,
        name: item.name,
        content: safeContent,
        parentId: item.parentId,
        metadata: item.metadata
      });
      return response.data;
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  },

  createFile: async (file: KnowledgeItem): Promise<KnowledgeItem> => {
    try {
      let safeContent = file.content;
      if (typeof safeContent === 'string' && (file.fileType === 'reels' || file.fileType === 'content-plan' || file.fileType === 'roadmap-item')) {
        safeContent = safeStringify(JSON.parse(safeContent));
      }

      const response = await api.post('/knowledge/save', {
        itemType: 'FILE',
        fileType: file.fileType,
        name: file.name,
        content: safeContent,
        parentId: file.parentId,
        metadata: file.metadata
      });
      return response.data;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  },

  createFolder: async (name: string, parentId?: string): Promise<KnowledgeItem> => {
    try {
      const response = await api.post('/knowledge/save', {
        itemType: 'FOLDER',
        name,
        parentId: parentId || null
      });
      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  updateItem: async (id: string, item: Partial<KnowledgeItem>): Promise<KnowledgeItem> => {
    try {
      let safeContent = item.content;
      if (typeof safeContent === 'string' && (item.fileType === 'reels' || item.fileType === 'content-plan' || item.fileType === 'roadmap-item')) {
        safeContent = safeStringify(JSON.parse(safeContent));
      }

      const response = await api.post('/knowledge/save', {
        id,
        itemType: item.type?.toUpperCase(),
        fileType: item.fileType,
        name: item.name,
        content: safeContent,
        parentId: item.parentId,
        metadata: item.metadata
      });
      return response.data;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  },

  deleteItem: async (id: string, isFolder: boolean = false): Promise<void> => {
    try {
      await api.delete(`/knowledge/${isFolder ? 'folder' : 'file'}/${id}`);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },

  moveItem: async (id: string, targetFolderId: string | null, isFolder: boolean = false): Promise<void> => {
    try {
      const moveRequest: MoveRequest = {
        id,
        itemType: isFolder ? 'folder' : 'file',
        targetFolderId
      };
      await api.post('/knowledge/move', moveRequest);
    } catch (error) {
      console.error('Error moving item:', error);
      throw error;
    }
  }
};

// Сервис для работы с roadmap
export const roadmapApi = {
  generate: async (data: { goal: string; deadline: string; detailLevel: number }): Promise<{ content: string }> => {
    try {
      const response = await api.post('/roadmap/generate', data);
      return response.data;
    } catch (error) {
      console.error('Error generating roadmap:', error);
      throw error;
    }
  }
};