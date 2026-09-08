import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/store/auth';
import { createPost } from '@/services/posts';
import { useOptimisticFeed } from '@/store/optimisticFeed';
import { Image as ImageIcon, Video, X, Loader2, BarChart2, Plus } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';

export default function CreatePostSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { profile } = useAuth();
  const { addPendingPost, removePendingPost, updatePendingPost } = useOptimisticFeed();
  
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setContent('');
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setIsPollMode(false);
    setPollOptions(['', '']);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (!isVideo && !isImage) {
        setError('Unsupported file type');
        return;
      }
      
      if (isImage && file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }
      
      if (isVideo && file.size > 50 * 1024 * 1024) {
        setError('Video must be less than 50MB');
        return;
      }
      
      setMediaFile(file);
      setMediaType(isVideo ? 'video' : 'image');
      setMediaPreview(URL.createObjectURL(file));
      setIsPollMode(false);
      setError('');
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaFile && (!isPollMode || !content.trim())) {
      return setError('Post content cannot be empty.');
    }
    
    let finalPollOptions: string[] | undefined;
    if (isPollMode) {
      finalPollOptions = pollOptions.map(o => o.trim()).filter(o => o.length > 0);
      if (finalPollOptions.length < 2) {
        return setError('A poll requires at least 2 options.');
      }
    }
    
    if (!profile) return setError('Not logged in');

    const tempId = 'temp_' + Date.now();
    const optimisticPost: any = {
      id: tempId,
      authorId: profile.uid,
      content,
      type: isPollMode ? 'poll' : (mediaType || 'text'),
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(),
      authorProfile: profile,
      localImagePreview: mediaPreview, // works for both object urls
      isUploading: true
    };
    
    if (isPollMode && finalPollOptions) {
      optimisticPost.pollOptions = finalPollOptions.map((text, i) => ({
        id: `opt_temp_${i}`,
        text,
        votesCount: 0
      }));
      optimisticPost.totalVotes = 0;
    }

    addPendingPost(optimisticPost);
    
    // Cache values before reset
    const postContent = content;
    const postMedia = mediaFile;
    const postPollOptions = finalPollOptions;
    
    handleClose(); // Close UI immediately
    
    try {
      await createPost(postContent, postMedia, postPollOptions);
      removePendingPost(tempId);
    } catch (err: any) {
      console.error('Failed to post:', err);
      updatePendingPost(tempId, { isUploading: false, uploadError: err.message || 'Failed to post.' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[90] h-[90vh] bg-[#111] rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
              <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors">
                Cancel
              </button>
              <h2 className="text-lg font-bold text-white">Create Post</h2>
              <button 
                onClick={handlePost} 
                disabled={!content.trim() && !mediaFile}
                className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded-full hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center"
              >
                Post
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <UserAvatar 
                  src={profile?.avatarUrl} 
                  name={profile?.displayName || profile?.username || 'User'} 
                  size="md" 
                />
                <div className="flex-1">
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={isPollMode ? "Ask a question..." : "What's going on, Luga Boy?"}
                    className={`w-full bg-transparent text-white text-lg focus:outline-none resize-none placeholder:text-white/30 ${isPollMode ? 'min-h-[60px]' : 'min-h-[120px]'}`}
                    maxLength={500}
                    autoFocus
                  />
                  
                  {isPollMode && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 flex flex-col gap-3"
                    >
                      {pollOptions.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2 relative">
                          <input 
                            type="text"
                            value={option}
                            onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            maxLength={40}
                          />
                          {pollOptions.length > 2 && (
                            <button 
                              onClick={() => removePollOption(idx)}
                              className="absolute right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {pollOptions.length < 4 && (
                        <button 
                          onClick={addPollOption}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                          Add Option
                        </button>
                      )}
                    </motion.div>
                  )}

                  {mediaPreview && !isPollMode && (
                    <div className="relative mt-4 rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
                      {mediaType === 'video' ? (
                        <video src={mediaPreview} controls className="w-full max-h-[300px]" />
                      ) : (
                        <img src={mediaPreview} alt="Upload preview" className="w-full object-cover max-h-[300px]" />
                      )}
                      
                      <button 
                        onClick={() => { setMediaFile(null); setMediaPreview(null); setMediaType(null); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-t border-white/10 flex items-center gap-2 pb-8 safe-pb">
              <button 
                onClick={() => {
                   if (fileInputRef.current) {
                     fileInputRef.current.accept = "image/jpeg, image/png, image/webp";
                     fileInputRef.current.click();
                   }
                }}
                disabled={isPollMode}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-blue-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Add Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                   if (fileInputRef.current) {
                     fileInputRef.current.accept = "video/mp4, video/quicktime, video/webm";
                     fileInputRef.current.click();
                   }
                }}
                disabled={isPollMode}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-purple-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Add Video"
              >
                <Video className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => {
                  setIsPollMode(!isPollMode);
                  if (!isPollMode) {
                    setMediaFile(null);
                    setMediaPreview(null);
                    setMediaType(null);
                  }
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isPollMode ? 'bg-orange-500 text-white' : 'bg-white/5 hover:bg-white/10 text-orange-400'
                }`}
                title="Create Poll"
              >
                <BarChart2 className="w-5 h-5" />
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleMediaChange}
                className="hidden" 
              />
              <div className="ml-auto text-xs font-medium text-white/40">
                {content.length}/500
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
