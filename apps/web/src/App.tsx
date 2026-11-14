import { TopNavBar } from './components/TopNavBar';
import { HomeView } from './components/HomeView';

export default function App() {
  return (
    <div id="top" className="min-h-screen bg-[#F8FAF7] text-[#111C16]">
      <TopNavBar />
      <HomeView />
    </div>
  );
}
