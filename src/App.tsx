/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { AuthProvider } from '@/store/AuthProvider';
import AppShell from '@/components/layout/AppShell';
import { engine } from '@/services/simulationEngine';

export default function App() {
  useEffect(() => {
    engine.start(5000); // 5 seconds interval for faster initial feel
    return () => engine.stop();
  }, []);

  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
