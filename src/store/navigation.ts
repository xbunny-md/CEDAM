import { create } from 'zustand';

export type ScreenId = 'home' | 'discover' | 'challenges' | 'challengeDetail' | 'leaderboard' | 'notifications' | 'profile' | 'about' | 'admin' | 'settings' | 'chatList' | 'chatRoom' | 'userList';

export interface Screen {
  id: ScreenId;
  props?: any;
}

interface NavigationState {
  stack: Screen[];
  push: (screenId: ScreenId, props?: any) => void;
  pop: () => void;
  reset: (screenId: ScreenId) => void;
  isCreateSheetOpen: boolean;
  setCreateSheetOpen: (isOpen: boolean) => void;
}

export const useNavigation = create<NavigationState>((set) => ({
  stack: [{ id: 'home' }], // Initial screen
  push: (screenId, props) => 
    set((state) => {
      // If the screen is already at the top, do nothing
      if (state.stack[state.stack.length - 1]?.id === screenId) {
        return state;
      }
      return { stack: [...state.stack, { id: screenId, props }] };
    }),
  pop: () => 
    set((state) => ({
      stack: state.stack.length > 1 ? state.stack.slice(0, -1) : state.stack,
    })),
  reset: (screenId) => 
    set(() => ({
      stack: [{ id: screenId }],
    })),
  isCreateSheetOpen: false,
  setCreateSheetOpen: (isOpen) => set({ isCreateSheetOpen: isOpen }),
}));
