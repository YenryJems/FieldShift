import React from 'react';
import { Compass } from 'lucide-react';
import { AppView, UserAccount } from '../types';

interface TopNavBarProps {
  currentView: AppView;
  onNavigate: (view: AppView, anchor?: string) => void;
  user: UserAccount | null;
  onLogout: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  onNavigate,
  user,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8DF] bg-[#F8FAF7]/95 backdrop-blur-sm no-print">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-line Brand Mark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-[#1B4332] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91] rounded-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B4332] text-white">
            <Compass className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">FieldShift</span>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#354A3E]"
        >
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`hover:text-[#111C16] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'home' ? 'text-[#111C16] font-semibold underline' : ''
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => onNavigate('workspace')}
            className={`hover:text-[#111C16] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'workspace' ? 'text-[#111C16] font-semibold underline' : ''
            }`}
          >
            Workspace
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home', 'plans')}
            className="hover:text-[#111C16] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Plans
          </button>
          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="hover:text-[#111C16] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign Out ({user.name.split(' ')[0]})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className={`hover:text-[#111C16] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'login' ? 'text-[#111C16] font-semibold underline' : ''
              }`}
            >
              Sign In
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {currentView !== 'workspace' ? (
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1B4332] px-4 text-sm font-semibold text-white hover:bg-[#2D6A4F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]"
            >
              Open Workspace
            </button>
          ) : user ? (
            <button
              type="button"
              onClick={() => onNavigate('home', 'plans')}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#CBD5C7] bg-white px-4 text-sm font-semibold text-[#111C16] hover:bg-[#EFF5F1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Manage Plan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1B4332] px-4 text-sm font-semibold text-white hover:bg-[#2D6A4F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]"
            >
              Create Account
            </button>
          )}
        </div>
      </div>

      {/* Compact mobile sub-links row only on <md screens */}
      <div className="flex md:hidden items-center justify-center gap-5 border-t border-[#E2E8DF] px-4 py-2 text-xs font-medium text-[#354A3E]">
        <button type="button" onClick={() => onNavigate('home')} className="whitespace-nowrap">
          Overview
        </button>
        <button type="button" onClick={() => onNavigate('workspace')} className="whitespace-nowrap">
          Workspace
        </button>
        <button
          type="button"
          onClick={() => onNavigate('home', 'plans')}
          className="whitespace-nowrap"
        >
          Plans
        </button>
        {user ? (
          <button type="button" onClick={onLogout} className="whitespace-nowrap">
            Sign Out
          </button>
        ) : (
          <button type="button" onClick={() => onNavigate('login')} className="whitespace-nowrap">
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
