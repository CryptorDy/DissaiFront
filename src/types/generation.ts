export type GenerationType = 'reels' | 'article' | 'roadmap' | 'notes' | 'educational' | 'simplify';

export interface GenerationTask {
  id: string;
  type: GenerationType;
  title: string;
  status: 'pending' | 'completed' | 'error' | 'cancelled';
  progress?: number;
  error?: string;
  result?: any;
  startedAt: number;
  completedAt?: number;
  showResult?: boolean;
  canCancel?: boolean;
}