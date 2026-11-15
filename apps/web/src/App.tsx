import { useState } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { HomeView } from './components/HomeView';
import { WorkspaceView } from './components/WorkspaceView';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  const [plannerStep, setPlannerStep] = useState(0);
  const [hasEnteredWorkspace, setHasEnteredWorkspace] = useState(false);

  return (
    <LanguageProvider>
      {hasEnteredWorkspace ? (
        <div id="top" className="workspace-enter min-h-screen bg-[#F8FAF7] text-[#111C16]">
          <TopNavBar
            plannerStep={plannerStep}
            onPlannerStepChange={setPlannerStep}
            onReturnHome={() => {
              setPlannerStep(0);
              setHasEnteredWorkspace(false);
            }}
          />
          <WorkspaceView plannerStep={plannerStep} onPlannerStepChange={setPlannerStep} />
        </div>
      ) : (
        <HomeView onEnterWorkspace={() => setHasEnteredWorkspace(true)} />
      )}
    </LanguageProvider>
  );
}
