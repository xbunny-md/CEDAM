import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, EyeOff, Loader2 } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { useAuth } from '@/store/auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '@/services/users';
import UserAvatar from '@/components/ui/UserAvatar';
import { uploadImage } from '@/services/upload';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  viewOnce?: boolean;
  viewed?: boolean;
  createdAt: Timestamp | null;
}

export default function ChatRoom({ targetUser }: { targetUser: UserProfile }) {
  const { pop } = useNavigation();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewOnce, setViewOnce] = useState(false);
  const [viewingOnceImage, setViewingOnceImage] = useState<{ id: string, url: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate a consistent chat ID between two users
  const chatId = [user?.uid, targetUser.uid].sort().join('_');

  useEffect(() => {
    if (!user) return;
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || !user) return;

    const msgText = newMessage.trim();
    setNewMessage('');
    
    const fileToUpload = imageFile;
    setImageFile(null); // clear preview

    setIsUploading(true);
    try {
      let uploadedUrl = '';
      if (fileToUpload) {
        uploadedUrl = await uploadImage(fileToUpload);
      }

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        text: msgText,
        imageUrl: uploadedUrl || null,
        viewOnce: uploadedUrl ? viewOnce : false,
        viewed: false,
        createdAt: serverTimestamp()
      });
      
      setViewOnce(false); // reset viewOnce after send
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleViewImage = async (msgId: string, url: string) => {
    setViewingOnceImage({ id: msgId, url });
  };
  
  const handleCloseViewOnce = async () => {
    if (!viewingOnceImage) return;
    try {
      const msgRef = doc(db, 'chats', chatId, 'messages', viewingOnceImage.id);
      await updateDoc(msgRef, { viewed: true });
    } catch(e) {
      console.error(e);
    }
    setViewingOnceImage(null);
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-[#050505]">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 bg-[#0a0a0a] border-b border-white/10 shrink-0 relative z-10 pt-12">
        <button 
          onClick={pop}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <UserAvatar src={targetUser.avatarUrl} name={targetUser.displayName || targetUser.username || ''} size="md" />
          <div>
            <h2 className="font-bold text-white leading-tight">{targetUser.displayName}</h2>
            <p className="text-xs text-white/50">@{targetUser.username}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3 pb-24 safe-pb">
        {messages.map((msg) => {
          const isMine = msg.senderId === user?.uid;
          
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  isMine 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-white/10 text-white rounded-tl-sm'
                }`}
              >
                {msg.imageUrl && (
                  <div className="mb-2">
                    {msg.viewOnce ? (
                      msg.viewed ? (
                        <div className="flex items-center gap-2 text-xs opacity-70 italic p-2 border border-white/20 rounded-lg">
                          <EyeOff className="w-4 h-4" /> Viewed Photo
                        </div>
                      ) : (
                        isMine ? (
                          <div className="flex items-center gap-2 text-xs opacity-70 italic p-2 border border-white/20 rounded-lg">
                            <ImageIcon className="w-4 h-4" /> Photo delivered (View Once)
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleViewImage(msg.id, msg.imageUrl!)}
                            className="flex items-center gap-2 text-sm font-semibold p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors w-full justify-center"
                          >
                            <ImageIcon className="w-5 h-5" /> Tap to View Photo
                          </button>
                        )
                      )
                    ) : (
                      <img src={msg.imageUrl} alt="chat attachment" className="rounded-xl w-full h-auto max-h-60 object-cover" />
                    )}
                  </div>
                )}
                {msg.text && <p className="text-sm">{msg.text}</p>}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0a0a0a] border-t border-white/10 shrink-0 pb-12 safe-pb">
        {imageFile && (
          <div className="mb-3 relative inline-block">
            <img src={URL.createObjectURL(imageFile)} alt="preview" className="w-20 h-20 object-cover rounded-xl border border-white/10" />
            <button 
              onClick={() => setImageFile(null)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white"
            >
              ×
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange}
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
            />
            {imageFile && (
              <button
                type="button"
                onClick={() => setViewOnce(!viewOnce)}
                title="View Once"
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${viewOnce ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/50'}`}
              >
                1
              </button>
            )}
          </div>
          <button 
            type="submit"
            disabled={isUploading || (!newMessage.trim() && !imageFile)}
            className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-white/10 shrink-0"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

      {viewingOnceImage && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <header className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <span className="text-white font-bold flex items-center gap-2">
              <EyeOff className="w-5 h-5" /> View Once
            </span>
            <button 
              onClick={handleCloseViewOnce}
              className="text-white font-bold bg-white/10 px-4 py-2 rounded-full hover:bg-white/20"
            >
              Close
            </button>
          </header>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={viewingOnceImage.url} alt="view once" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
          <div className="p-4 text-center text-white/50 text-xs">
            This photo will disappear after you close it.
          </div>
        </div>
      )}
    </div>
  );
}
