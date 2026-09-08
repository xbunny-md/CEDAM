import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/store/auth';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Loader2 } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { uploadImage } from '@/services/upload';
import UserAvatar from '@/components/ui/UserAvatar';

export default function EditProfileSheet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { profile, user } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && isOpen) {
      setDisplayName(profile.displayName);
      setUsername(profile.username);
      setBio(profile.bio || '');
      setImagePreview(profile.avatarUrl);
      setImageFile(null);
      setError('');
    }
  }, [profile, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    
    const newUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (newUsername.length < 3) {
      return setError('Username must be at least 3 characters.');
    }
    
    setLoading(true);
    setError('');

    try {
      let finalAvatarUrl = profile.avatarUrl;

      // Upload image to ImgBB if changed
      if (imageFile) {
        finalAvatarUrl = await uploadImage(imageFile);
        
        await updateProfile(user, {
          photoURL: finalAvatarUrl
        });
      } else if (displayName !== profile.displayName) {
        await updateProfile(user, {
          displayName
        });
      }

      // If username changed, we need a transaction to swap it
      if (newUsername !== profile.username) {
        await runTransaction(db, async (transaction) => {
          const newUsernameRef = doc(db, 'usernames', newUsername);
          const newUsernameDoc = await transaction.get(newUsernameRef);
          
          if (newUsernameDoc.exists()) {
            throw new Error('Username is already taken.');
          }

          const oldUsernameRef = doc(db, 'usernames', profile.username);
          const userRef = doc(db, 'users', user.uid);
          
          // Claim new username, release old, update profile
          transaction.set(newUsernameRef, { uid: user.uid });
          transaction.delete(oldUsernameRef);
          transaction.update(userRef, {
            displayName,
            bio,
            username: newUsername,
            avatarUrl: finalAvatarUrl
          });
        });
      } else {
        // Just update normal profile fields
        await runTransaction(db, async (transaction) => {
           const userRef = doc(db, 'users', user.uid);
           transaction.update(userRef, {
             displayName,
             bio,
             avatarUrl: finalAvatarUrl
           });
        });
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
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
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[90] h-[85vh] bg-[#111] rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
              <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                Cancel
              </button>
              <h2 className="text-lg font-bold text-white">Edit Profile</h2>
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="text-blue-400 font-bold hover:text-blue-300 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto pb-24 safe-pb">
              {error && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Avatar Edit */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-24 h-24 rounded-full bg-[#111] p-1 border-2 border-white/10 mb-4">
                  <UserAvatar 
                    src={imagePreview} 
                    name={displayName || username || 'User'} 
                    size="xl" 
                    className="w-full h-full"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-[#111]"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange}
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="Your Name"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="username"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Bio</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                    placeholder="Tell us about yourself..."
                    maxLength={150}
                  />
                  <div className="text-right text-xs text-white/40 mt-1">
                    {bio.length}/150
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <button 
                    onClick={async () => {
                      const { logoutUser } = await import('@/services/auth');
                      await logoutUser();
                    }}
                    className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
