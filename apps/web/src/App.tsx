import { useState } from 'react';
import { TopNavBar, type WorkbenchTab } from './components/TopNavBar';
import { HomeView } from './components/HomeView';
import { WorkspaceView } from './components/WorkspaceView';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('field-season');
  const [hasEnteredWorkspace, setHasEnteredWorkspace] = useState(false);

  return (
    <LanguageProvider>
      {hasEnteredWorkspace ? (
        <div id="top" className="workspace-enter min-h-screen bg-[#040811] text-[#F0F9FF]">
          <TopNavBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onReturnHome={() => {
              setActiveTab('field-season');
              setHasEnteredWorkspace(false);
            }}
          />
          <WorkspaceView activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      ) : (
        <HomeView onEnterWorkspace={() => setHasEnteredWorkspace(true)} />
      )}
    </LanguageProvider>
  );
}
