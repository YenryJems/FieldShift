import { useState } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { HomeView } from './components/HomeView';
import { IntroSequence } from './components/IntroSequence';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  const [plannerStep, setPlannerStep] = useState(0);

  return (
    <LanguageProvider>
      <div id="top" className="min-h-screen bg-[#F8FAF7] text-[#111C16] lg:pl-64">
        <TopNavBar plannerStep={plannerStep} onPlannerStepChange={setPlannerStep} />
        <HomeView plannerStep={plannerStep} onPlannerStepChange={setPlannerStep} />
      </div>
      <IntroSequence />
    </LanguageProvider>
  );
}
