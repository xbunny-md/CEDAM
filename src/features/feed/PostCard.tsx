import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, toggleLike, deletePost, toggleSavePost, reportPost, voteOnPoll } from '@/services/posts';
import { useAuth } from '@/store/auth';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Flag, Trash2, Loader2, AlertCircle } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import CommentsSheet from './CommentsSheet';
import { useNavigation } from '@/store/navigation';

interface PostCardProps {
  post: Post & { localImagePreview?: string, isUploading?: boolean, uploadError?: string }
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const { push } = useNavigation();
  
  // Local optimistic state for likes
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  
  const [isSaved, setIsSaved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  
  const isAuthor = user?.uid === post.authorId;
  const isOptimistic = post.isUploading || post.uploadError;

  // Time formatter
  const timeAgo = (date: any) => {
    if (!date) return 'Just now';
    const now = new Date();
    const past = date.toDate ? date.toDate() : new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const handleLike = async () => {
    if (!user || isOptimistic) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      await toggleLike(post.id, !newLiked);
    } catch (err) {
      setIsLiked(!newLiked);
      setLikesCount(prev => !newLiked ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleSave = async () => {
    if (!user || isOptimistic) return;
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    setIsMenuOpen(false);
    
    try {
      await toggleSavePost(post.id, !newSaved);
    } catch (err) {
      setIsSaved(!newSaved);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(post.id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete post");
    }
  };

  const handleReport = async () => {
    setIsMenuOpen(false);
    const reason = window.prompt("Reason for reporting:");
    if (reason) {
      try {
        await reportPost(post.id, reason);
        alert("Report submitted successfully.");
      } catch (err) {
        alert("Failed to report post.");
      }
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/?post=${post.id}`;
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        await navigator.share({
          title: `Post by @${post.authorProfile?.username || 'user'}`,
          text: post.content || 'Check out this post on LUGA BOYZ',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard! You can share this link to direct others to this post.");
      }
    } catch (err) {
      console.log('Share failed', err);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card mb-4 relative ${isOptimistic ? 'opacity-80' : ''}`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => { e.stopPropagation(); push('profile', { userId: post.authorId }); }}
          >
            <UserAvatar 
              src={post.authorProfile?.avatarUrl} 
              name={post.authorProfile?.displayName || post.authorProfile?.username || 'User'} 
              size="md" 
            />
            <div>
              <h3 className="font-bold text-white text-sm">
                {post.authorProfile?.displayName || 'Unknown User'}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-blue-400">@{post.authorProfile?.username || 'user'}</span>
                <span className="text-white/30">•</span>
                <span className="text-white/40">{timeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {post.isUploading && (
               <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium bg-blue-500/10 px-2 py-1 rounded-full">
                 <Loader2 className="w-3 h-3 animate-spin" />
                 Sending
               </div>
            )}
            {post.uploadError && (
               <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded-full">
                 <AlertCircle className="w-3 h-3" />
                 Failed
               </div>
            )}
            {!isOptimistic && (
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          {post.content && (
            <p className="text-white/90 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}
          
          {post.type === 'poll' && post.pollOptions && (
            <div className="mt-4 flex flex-col gap-2">
              {post.pollOptions.map(option => {
                const totalVotes = post.totalVotes || 0;
                const percentage = totalVotes > 0 ? Math.round((option.votesCount / totalVotes) * 100) : 0;
                const isSelected = post.hasVotedOptionId === option.id;
                const hasVoted = !!post.hasVotedOptionId;

                return (
                  <button
                    key={option.id}
                    disabled={hasVoted}
                    onClick={() => {
                      if (!hasVoted) {
                        voteOnPoll(post.id, option.id).catch(console.error);
                      }
                    }}
                    className={`relative w-full text-left rounded-xl p-3 overflow-hidden border transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500/20' 
                        : hasVoted 
                          ? 'border-white/5 bg-white/5' 
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {hasVoted && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`absolute inset-0 opacity-20 ${isSelected ? 'bg-blue-400' : 'bg-white'}`}
                      />
                    )}
                    <div className="relative flex justify-between items-center z-10">
                      <span className={`font-medium ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                        {option.text}
                      </span>
                      {hasVoted && (
                        <span className="text-sm font-bold text-white/80">{percentage}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
              <div className="text-xs text-white/40 mt-1">
                {post.totalVotes || 0} votes
              </div>
            </div>
          )}
          
          {(post.mediaUrl || post.localImagePreview) && post.type !== 'poll' && (
            <div className="rounded-2xl overflow-hidden border border-white/5 bg-[#0a0a0a] relative">
              {post.type === 'video' ? (
                <video 
                  src={post.localImagePreview || post.mediaUrl} 
                  controls 
                  className={`w-full max-h-[400px] object-cover ${post.isUploading ? 'opacity-50 blur-sm' : ''}`}
                />
              ) : (
                <img 
                  src={post.localImagePreview || post.mediaUrl} 
                  alt="Post media" 
                  className={`w-full h-auto object-cover max-h-[400px] ${post.isUploading ? 'opacity-50 blur-sm' : ''}`}
                  loading="lazy"
                />
              )}
              {post.isUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin drop-shadow-md" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLike}
              disabled={!!isOptimistic}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isLiked ? 'text-rose-500' : 'text-white/60 hover:text-white'
              } ${isOptimistic ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount}
            </button>
            
            <button 
              onClick={() => !isOptimistic && setIsCommentsOpen(true)}
              disabled={!!isOptimistic}
              className={`flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors ${isOptimistic ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MessageCircle className="w-5 h-5" />
              {post.commentsCount}
            </button>
          </div>
          
          <button 
            onClick={handleShare}
            disabled={!!isOptimistic}
            className={`w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 transition-colors ${isOptimistic ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Options Menu Bottom Sheet */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 z-[110] bg-[#1a1a1a] rounded-t-3xl p-4 safe-pb border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                
                <div className="space-y-2">
                  <button 
                    onClick={handleSave}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 text-white transition-colors"
                  >
                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current text-blue-400' : ''}`} />
                    <span className="font-medium">{isSaved ? 'Unsave Post' : 'Save Post'}</span>
                  </button>
                  
                  {isAuthor ? (
                    <button 
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="font-medium">Delete Post</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleReport}
                      className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
                    >
                      <Flag className="w-5 h-5" />
                      <span className="font-medium">Report Post</span>
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full p-4 mt-4 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
      <CommentsSheet postId={post.id} isOpen={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} />
    </>
  );
};

export default PostCard;
