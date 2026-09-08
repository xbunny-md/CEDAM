import { ArrowLeft, ExternalLink, Download } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function About() {
  const { pop } = useNavigation();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <div className="w-full min-h-full pt-12 px-4 pb-32 bg-[#050505]">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={pop}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">About LUGA BOYZ</h1>
        </div>
        
        {/* PWA Install Button */}
        {!isInstalled && (isInstallable || isIOS) && (
          <button
            onClick={install}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        )}
      </header>

      {/* Hero Logo */}
      <div className="flex flex-col items-center justify-center py-12 mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent blur-[50px] pointer-events-none" />
        <h2 className="text-4xl font-display font-black tracking-tight text-white mb-2 relative z-10">
          LUGA BOYZ
        </h2>
        <p className="text-blue-400 font-medium relative z-10">Mwanalugali Boys Social Hub</p>
      </div>

      {/* Creator Card */}
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 px-2">Founder & Creator</h3>
      
      <div className="glass-card mb-12 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] shrink-0">
            <div className="w-full h-full bg-[#111] rounded-full overflow-hidden">
               <img src="https://i.ibb.co/chDNHsvK/1788680057122.png" alt="Lupin Starnley Jimoh" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-black text-white">Lupin Starnley Jimoh</h4>
            <p className="text-blue-400 font-bold mt-1 tracking-wider uppercase text-sm">Full-Stack Engineer & Innovator</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-medium">PCM Student</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-medium">React / Node.js</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-medium">Firebase</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-medium">Tailwind CSS</span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h5 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">My Journey</h5>
          <p className="text-white/80 text-sm leading-relaxed mb-4">
            I am <strong className="text-white">Lupin Starnley Jimoh</strong>, a student pursuing PCM (Physics, Chemistry, and Mathematics) at <strong className="text-blue-400">Mwanalugali Secondary School</strong>. 
            The inception of the LUGA BOYZ application was born out of a genuine desire to connect my fellow students. 
          </p>
          <p className="text-white/80 text-sm leading-relaxed mb-4">
            Realizing the gap in social interaction and digital engagement within our school, I set out to build a platform that wasn't just a basic chat app, but a fully-fledged social ecosystem. LUGA BOYZ brings together modern social features, real-time gamification, interactive challenges, and a robust simulated community engine—all crafted to keep the Mwanalugali spirit alive and competitive.
          </p>
          <p className="text-white/80 text-sm leading-relaxed">
            As a self-taught Full-Stack Developer, this project reflects my deep passion for coding and digital architecture. I specialize in the modern web stack (React, TypeScript, Node.js, Firebase) and am constantly exploring how technology can bridge human connections.
          </p>
        </div>

        <div className="mb-8">
          <h5 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Featured Projects & Repos</h5>
          
          <div className="grid gap-3">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors">
              <h6 className="font-bold text-white mb-1">LUGA BOYZ (Mwanalugali Hub)</h6>
              <p className="text-xs text-white/60 mb-3">The premium social architecture and gamified hub for Mwanalugali Secondary School. Built with React, Tailwind, and Firebase.</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-bold tracking-wider">LIVE</span>
                <span className="px-2 py-1 rounded-md bg-white/10 text-white/70 text-[10px] font-bold tracking-wider">FULL-STACK</span>
              </div>
            </div>

            <a 
              href="https://github.com/xbotmanager-cell" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors group"
            >
              <div className="flex justify-between items-start mb-1">
                <h6 className="font-bold text-white group-hover:text-purple-400 transition-colors">@xbotmanager-cell Repositories</h6>
                <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-purple-400 transition-colors" />
              </div>
              <p className="text-xs text-white/60 mb-3">Explore my open-source contributions, bot managers, and experimental full-stack projects on GitHub.</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded-md bg-white/10 text-white/70 text-[10px] font-bold tracking-wider">OPEN SOURCE</span>
                <span className="px-2 py-1 rounded-md bg-white/10 text-white/70 text-[10px] font-bold tracking-wider">TYPESCRIPT</span>
              </div>
            </a>
          </div>
        </div>

        <h5 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Connect with Me</h5>
        <div className="grid gap-3">
          <a 
            href="https://www.tiktok.com/@micknellla" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00f2fe]/20 flex items-center justify-center text-[#00f2fe]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
              </div>
              <span className="font-medium text-white">@micknellla</span>
            </div>
            <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
          </a>

          <a 
            href="https://www.instagram.com/micknella" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </div>
              <span className="font-medium text-white">@micknella</span>
            </div>
            <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
          </a>

          <a 
            href="https://www.facebook.com/micknella" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </div>
              <span className="font-medium text-white">@micknella</span>
            </div>
            <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
          </a>

          <a 
            href="https://wa.me/255780470905" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </div>
              <span className="font-medium text-white">+255 780 470 905</span>
            </div>
            <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
          </a>
        </div>
      </div>
      
      <div className="text-center text-white/30 text-xs pb-8">
        <p>LUGA BOYZ Phase 1 Foundation</p>
        <p className="mt-1">Mwanalugali Secondary School</p>
      </div>
    </div>
  );
}
