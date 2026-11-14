import { useState } from 'react';
import { AppView, PlanTierId, UserAccount } from './types';
import { TopNavBar } from './components/TopNavBar';
import { HomeView } from './components/HomeView';
import { AuthView } from './components/AuthView';
import { WorkspaceView } from './components/WorkspaceView';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedPlanForAuth, setSelectedPlanForAuth] = useState<PlanTierId>('free');
  const [user, setUser] = useState<UserAccount | null>(null);

  const handleNavigate = (view: AppView, anchor?: string) => {
    setCurrentView(view);
    if (anchor) {
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAuthenticate = (account: UserAccount) => {
    setUser(account);
    handleNavigate('workspace');
  };

  const handleLogout = () => {
    setUser(null);
    handleNavigate('home');
  };

  const handleSelectPlanForRegister = (planId: PlanTierId) => {
    setSelectedPlanForAuth(planId);
    if (user) {
      setUser({ ...user, planId });
      handleNavigate('workspace');
    } else {
      handleNavigate('register');
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#F8FAF7] text-[#111C16]">
      <TopNavBar
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {currentView === 'home' && (
        <HomeView
          onNavigate={handleNavigate}
          onSelectPlanForRegister={handleSelectPlanForRegister}
          user={user}
        />
      )}

      {(currentView === 'login' || currentView === 'register') && (
        <AuthView
          mode={currentView}
          defaultPlanId={selectedPlanForAuth}
          onSwitchMode={(m) => setCurrentView(m)}
          onNavigateHome={() => handleNavigate('home')}
          onAuthenticate={handleAuthenticate}
        />
      )}

      {currentView === 'workspace' && <WorkspaceView />}
    </div>
  );
}
