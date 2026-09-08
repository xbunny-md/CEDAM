import React, { useState, useRef } from 'react';
import { registerUser, checkUsernameUnique } from '@/services/auth';
import { Mail, Lock, User, AtSign, Loader2, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { uploadImage } from '@/services/upload';
import UserAvatar from '@/components/ui/UserAvatar';

export default function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    stream: ''
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Basic debounce for username check
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
    setFormData(prev => ({ ...prev, username: value }));
    
    if (value.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    
    setUsernameStatus('checking');
    // Debounce simulation (in real app use a proper hook or debounce function)
    const timeout = setTimeout(async () => {
      try {
        const isUnique = await checkUsernameUnique(value);
        setUsernameStatus(isUnique ? 'available' : 'taken');
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 500);
    
    return () => clearTimeout(timeout);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.displayName || !formData.username || !formData.email || !formData.password) {
      return setError('Please fill in all fields.');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (usernameStatus === 'taken') {
      return setError('Username is already taken.');
    }

    setLoading(true);
    try {
      let profilePicture = '';
      if (imageFile) {
        profilePicture = await uploadImage(imageFile);
      }
      await registerUser({ ...formData, profilePicture });
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="glass-card w-full">
      <h2 className="text-2xl font-bold text-white mb-6">Join LUGA BOYZ</h2>
      
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-20 h-20 rounded-full bg-[#111] p-1 border-2 border-white/10 mb-2">
            <UserAvatar 
              src={imagePreview} 
              name={formData.displayName || formData.username || 'User'} 
              size="xl" 
              className="w-full h-full"
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-[#111]"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <span className="text-xs text-white/50">Add Profile Picture</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange}
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Display Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="e.g. John Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Username</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              value={formData.username}
              onChange={handleUsernameChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="username"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
              {usernameStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              {usernameStatus === 'taken' && <XCircle className="w-5 h-5 text-red-400" />}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Stream / Faction (Optional)</label>
          <select
            value={formData.stream}
            onChange={(e) => setFormData(prev => ({ ...prev, stream: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
          >
            <option value="" className="bg-[#111]">Select Stream...</option>
            <option value="PCM" className="bg-[#111]">PCM</option>
            <option value="PCB" className="bg-[#111]">PCB</option>
            <option value="HKL" className="bg-[#111]">HKL</option>
            <option value="HGLi" className="bg-[#111]">HGLi</option>
            <option value="HGL" className="bg-[#111]">HGL</option>
            <option value="HGE" className="bg-[#111]">HGE</option>
            <option value="HGV" className="bg-[#111]">HGV</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="luga@boyz.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="password" 
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || usernameStatus === 'taken'}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center h-12 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-purple-400 font-bold hover:underline">
          Log In
        </button>
      </p>
    </div>
  );
}
