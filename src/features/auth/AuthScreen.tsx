import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/store/auth';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="absolute inset-0 z-[100] bg-[#0a0a0a] flex flex-col justify-center px-6 overflow-y-auto overflow-x-hidden pt-12 pb-24 safe-pb">
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-4xl font-display font-black tracking-tight text-white mb-2">
          LUGA BOYZ
        </h1>
        <p className="text-blue-400 font-medium">Mwanalugali Boys Social Hub</p>
      </div>

      <div className="relative w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <LoginForm onSwitch={() => setMode('register')} />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RegisterForm onSwitch={() => setMode('login')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
