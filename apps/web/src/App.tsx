import { TopNavBar } from './components/TopNavBar';
import { HomeView } from './components/HomeView';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <div id="top" className="min-h-screen bg-[#F8FAF7] text-[#111C16]">
        <TopNavBar />
        <HomeView />
      </div>
    </LanguageProvider>
  );
}
