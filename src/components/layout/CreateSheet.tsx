import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigation } from '@/store/navigation';
import { PenSquare, BarChart2, Target, X } from 'lucide-react';
import CreatePostSheet from '@/features/feed/CreatePostSheet';

export default function CreateSheet() {
  const { isCreateSheetOpen, setCreateSheetOpen } = useNavigation();
  const [isPostOpen, setIsPostOpen] = useState(false);

  const options = [
    { id: 'post', icon: PenSquare, label: 'Create Post', color: 'from-blue-500 to-blue-600', action: () => { setCreateSheetOpen(false); setIsPostOpen(true); } },
    { id: 'poll', icon: BarChart2, label: 'Start a Poll', color: 'from-purple-500 to-purple-600', action: () => {} },
    { id: 'challenge', icon: Target, label: 'New Challenge', color: 'from-pink-500 to-rose-600', action: () => {} },
  ];

  return (
    <>
      <AnimatePresence>
        {isCreateSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateSheetOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 1 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) {
                  setCreateSheetOpen(false);
                }
              }}
              className="fixed bottom-0 left-0 right-0 z-[70] pt-6 pb-12 px-6 bg-[#111] rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] touch-none"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-bold text-white">Create</h2>
                <button 
                  onClick={() => setCreateSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid gap-4">
                {options.map((option, idx) => (
                  <motion.button
                    key={option.id}
                    onClick={option.action}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="w-full flex items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <option.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="ml-4 text-lg font-medium text-white">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <CreatePostSheet isOpen={isPostOpen} onClose={() => setIsPostOpen(false)} />
    </>
  );
}
