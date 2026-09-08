import AnimatedBackground from '../ui/AnimatedBackground';
import BottomNav from './BottomNav';
import StackedRouter from './StackedRouter';
import CreateSheet from './CreateSheet';
import { PWAInstallPopup } from '../ui/PWAInstallPopup';
import NotificationToast from '../ui/NotificationToast';
import { useAuth } from '@/store/auth';
import AuthScreen from '@/features/auth/AuthScreen';
import { Loader2 } from 'lucide-react';

export default function AppShell() {
  const { user, profile, isLoading } = useAuth();

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden text-foreground selection:bg-blue-500/30">
      <AnimatedBackground />
      
      {isLoading ? (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]">
          <AnimatedBackground />
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl font-display font-bold text-white">LUGA BOYZ</h2>
        </div>
      ) : !user ? (
        <AuthScreen />
      ) : (
        <>
          <StackedRouter />
          <BottomNav />
          <CreateSheet />
          <PWAInstallPopup />
          <NotificationToast />
        </>
      )}
    </div>
  );
}
