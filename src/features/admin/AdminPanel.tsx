import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Square, Users, Database, Activity, RefreshCw } from 'lucide-react';
import { useNavigation } from '@/store/navigation';
import { useAuth } from '@/store/auth';
import { engine } from '@/services/simulationEngine';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminPanel() {
  const { pop } = useNavigation();
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(engine.getStatus());
  const [logs, setLogs] = useState<string[]>([]);
  const [simUserCount, setSimUserCount] = useState<number | null>(null);
  const [intervalSecs, setIntervalSecs] = useState(5);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Security check: Only jkambi00@gmail.com can view
  if (user?.email !== 'jkambi00@gmail.com') {
    return (
      <div className="flex-1 flex items-center justify-center text-white flex-col gap-4 h-full p-4">
        <Database className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-gray-400 text-center">You do not have permission to view the Simulation Engine.</p>
        <button onClick={pop} className="mt-4 px-6 py-2 bg-white/10 rounded-full">Go Back</button>
      </div>
    );
  }

  useEffect(() => {
    engine.setLogger((msg) => {
      setLogs((prev) => [...prev.slice(-49), `${new Date().toLocaleTimeString()} - ${msg}`]);
    });
    fetchStats();
    
    // Sync UI state with engine on mount
    setIsRunning(engine.getStatus());
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fetchStats = async () => {
    try {
      const coll = collection(db, 'users');
      const q = query(coll, where('isSimulated', '==', true));
      const snapshot = await getCountFromServer(q);
      setSimUserCount(snapshot.data().count);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeed = async () => {
    await engine.seedInitialAccounts(100);
    fetchStats();
  };

  const toggleEngine = () => {
    if (isRunning) {
      engine.stop();
      setIsRunning(false);
    } else {
      engine.start(intervalSecs * 1000);
      setIsRunning(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 flex items-center h-16 px-4">
        <button onClick={pop} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold ml-4">Simulation Engine</h1>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Warning Banner */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <h2 className="text-red-400 font-bold flex items-center gap-2">
            <Database className="w-5 h-5" />
            ADMIN CONTROL ONLY
          </h2>
          <p className="text-sm text-red-300/80 mt-2">
            This engine generates synthetic community activity (posts, likes, follows) using simulated accounts. Do not manipulate real-user data.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <span className="text-2xl font-bold">{simUserCount ?? '...'}</span>
            <span className="text-xs text-gray-400">Simulated Accounts</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
            <Activity className="w-6 h-6 text-green-400 mb-2" />
            <span className="text-lg font-bold">{isRunning ? 'RUNNING' : 'STOPPED'}</span>
            <span className="text-xs text-gray-400">Engine Status</span>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-lg border-b border-white/10 pb-2">Controls</h3>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleSeed}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Users className="w-5 h-5" />
              Seed 100 Accounts
            </button>
            
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <label className="text-sm text-gray-400">Activity Frequency (Seconds)</label>
              <input 
                type="number" 
                value={intervalSecs} 
                onChange={(e) => setIntervalSecs(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                min="1"
              />
            </div>

            <button 
              onClick={toggleEngine}
              className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg ${
                isRunning 
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' 
                  : 'bg-green-600 hover:bg-green-500 shadow-green-600/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-6 h-6 fill-current" />
                  EMERGENCY STOP
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current" />
                  START SIMULATION
                </>
              )}
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-black border border-white/10 rounded-xl p-4 flex flex-col h-64">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin text-green-400' : 'text-gray-500'}`} />
              Activity Logs
            </h3>
            <span className="text-xs text-gray-500">{logs.length} events</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-gray-600 text-center mt-8">No activity yet...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-green-400/80 break-words">
                  {log}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
