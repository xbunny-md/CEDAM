import { create } from 'zustand';
import { Post } from '@/services/posts';

interface OptimisticState {
  pendingPosts: (Post & { localImagePreview?: string, isUploading?: boolean, uploadError?: string })[];
  addPendingPost: (post: Post & { localImagePreview?: string, isUploading?: boolean }) => void;
  removePendingPost: (id: string) => void;
  updatePendingPost: (id: string, updates: Partial<Post & { localImagePreview?: string, isUploading?: boolean, uploadError?: string }>) => void;
}

export const useOptimisticFeed = create<OptimisticState>((set) => ({
  pendingPosts: [],
  addPendingPost: (post) => set((state) => ({ pendingPosts: [post, ...state.pendingPosts] })),
  removePendingPost: (id) => set((state) => ({ pendingPosts: state.pendingPosts.filter(p => p.id !== id) })),
  updatePendingPost: (id, updates) => set((state) => ({
    pendingPosts: state.pendingPosts.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
}));
