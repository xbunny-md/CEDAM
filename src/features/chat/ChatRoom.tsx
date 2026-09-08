import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { useAuth } from '@/store/auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { UserProfile } from '@/services/users';
import UserAvatar from '@/components/ui/UserAvatar';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp | null;
}

export default function ChatRoom({ targetUser }: { targetUser: UserProfile }) {
  const { pop } = useNavigation();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgText = newMessage.trim();
    setNewMessage(''); // optimistic clear

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        text: msgText,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message.');
    }
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
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0a0a0a] border-t border-white/10 shrink-0 pb-12 safe-pb">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-white/10"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
