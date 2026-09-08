import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { addComment, deleteComment, editComment } from '@/services/posts';
import { useAuth } from '@/store/auth';
import { X, Send, Loader2, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { useNavigation } from '@/store/navigation';

export default function CommentsSheet({ postId, isOpen, onClose }: { postId: string, isOpen: boolean, onClose: () => void }) {
  const { profile, user } = useAuth();
  const { push } = useNavigation();
  
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    const q = query(
      collection(db, 'posts', postId, 'comments'), 
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const withProfiles = await Promise.all(
        data.map(async (c: any) => {
          try {
             const userDoc = await getDoc(doc(db, 'users', c.authorId));
             if (userDoc.exists()) {
               c.authorProfile = userDoc.data();
             }
             return c;
          } catch(e) {
             return c;
          }
        })
      );
      
      setComments(withProfiles);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [postId, isOpen]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || posting) return;
    
    setPosting(true);
    try {
      if (editingCommentId) {
        await editComment(postId, editingCommentId, newComment.trim());
        setEditingCommentId(null);
      } else {
        await addComment(postId, newComment.trim());
      }
      setNewComment('');
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment(postId, commentId);
      } catch (err) {
        alert("Failed to delete comment");
      }
    }
    setActiveMenuId(null);
  };

  const startEdit = (comment: any) => {
    setEditingCommentId(comment.id);
    setNewComment(comment.content);
    setActiveMenuId(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[130] h-[85vh] bg-[#111] rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
              <h2 className="text-lg font-bold text-white">Comments</h2>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex justify-center py-8 text-white/50">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <p>No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map(c => {
                  const isMine = c.authorId === user?.uid;
                  return (
                    <div key={c.id} className="flex gap-3 relative">
                      <UserAvatar 
                        src={c.authorProfile?.avatarUrl} 
                        name={c.authorProfile?.displayName || c.authorProfile?.username || 'User'} 
                        size="md" 
                        onClick={() => { onClose(); push('profile', { userId: c.authorId }); }}
                      />
                      <div className="flex-1">
                        <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 border border-white/5 relative group pr-10">
                          <p className="text-sm font-bold text-white mb-1">
                            {c.authorProfile?.displayName || 'Unknown'}
                          </p>
                          <p className="text-sm text-white/90">{c.content}</p>
                          
                          {/* Menu Trigger */}
                          {isMine && (
                            <button 
                              onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                              className="absolute top-2 right-2 p-1 text-white/40 hover:text-white transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Dropdown Menu */}
                          {activeMenuId === c.id && isMine && (
                            <div className="absolute top-8 right-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
                              <button 
                                onClick={() => startEdit(c)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <div className="w-full h-px bg-white/10" />
                              <button 
                                onClick={() => handleDelete(c.id)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-2">
                          <span className="text-xs text-white/40">
                            {c.createdAt ? new Date(c.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                          </span>
                          {c.isEdited && (
                            <span className="text-[10px] text-white/30 italic">Edited</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 shrink-0 pb-16 safe-pb bg-[#0a0a0a]">
              {editingCommentId && (
                <div className="flex items-center justify-between px-2 mb-2 text-xs text-blue-400">
                  <span>Editing comment...</span>
                  <button onClick={() => { setEditingCommentId(null); setNewComment(''); }} className="text-white/50 hover:text-white">Cancel</button>
                </div>
              )}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={editingCommentId ? "Update your comment..." : "Add a comment..."}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim() || posting}
                  className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white disabled:opacity-50 transition-colors shrink-0"
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
