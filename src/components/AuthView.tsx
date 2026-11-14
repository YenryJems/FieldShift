import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PlanTierId, SUBSCRIPTION_PLANS, UserAccount } from '../types';

interface AuthViewProps {
  mode: 'login' | 'register';
  defaultPlanId: PlanTierId;
  onSwitchMode: (mode: 'login' | 'register') => void;
  onNavigateHome: () => void;
  onAuthenticate: (account: UserAccount) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  mode,
  defaultPlanId,
  onSwitchMode,
  onNavigateHome,
  onAuthenticate,
}) => {
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [planId, setPlanId] = useState<PlanTierId>(defaultPlanId);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    onAuthenticate({
      name: mode === 'register' ? name.trim() : trimmedEmail.split('@')[0],
      email: trimmedEmail,
      farmName: farmName.trim() || 'Sample Farm Plot',
      planId,
    });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <button
        type="button"
        onClick={onNavigateHome}
        className="mb-6 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-[#354A3E] hover:text-[#111C16] cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Back to Overview</span>
      </button>

      <div className="rounded-xl border border-[#D4DDD0] bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111C16]">
          {mode === 'login' ? 'Sign in to FieldShift' : 'Create your account'}
        </h1>
        <p className="mt-1.5 text-sm text-[#354A3E]">
          {mode === 'login'
            ? 'Enter your details to view the FieldShift workspace.'
            : 'Choose a plan and set up your farm profile.'}
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-[#DC2626]/30 bg-[#FEE2E2] px-3.5 py-2.5 text-xs font-semibold text-[#991B1B]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold text-[#2F4337]">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elena Santos"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5C7] bg-[#F8FAF7] px-3 text-sm text-[#111C16] focus-visible:outline-2 focus-visible:outline-[#0B3D91]"
                />
              </div>

              <div>
                <label htmlFor="auth-farm" className="block text-xs font-semibold text-[#2F4337]">
                  Farm or Cooperative Name
                </label>
                <input
                  id="auth-farm"
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="Talavera Valley Co-op"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5C7] bg-[#F8FAF7] px-3 text-sm text-[#111C16] focus-visible:outline-2 focus-visible:outline-[#0B3D91]"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-[#2F4337]">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.org"
              className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5C7] bg-[#F8FAF7] px-3 text-sm text-[#111C16] focus-visible:outline-2 focus-visible:outline-[#0B3D91]"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-[#2F4337]">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5C7] bg-[#F8FAF7] px-3 text-sm text-[#111C16] focus-visible:outline-2 focus-visible:outline-[#0B3D91]"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="auth-plan" className="block text-xs font-semibold text-[#2F4337]">
                Subscription Plan
              </label>
              <select
                id="auth-plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value as PlanTierId)}
                className="mt-1.5 h-10 w-full rounded-lg border border-[#CBD5C7] bg-[#F8FAF7] px-3 text-sm font-medium text-[#111C16] focus-visible:outline-2 focus-visible:outline-[#0B3D91]"
              >
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.monthlyPrice === 0 ? 'Free' : `$${plan.monthlyPrice}/mo`})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="h-11 w-full rounded-lg bg-[#1B4332] text-sm font-semibold text-white hover:bg-[#2D6A4F] transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 border-t border-[#E2E8DF] pt-4 text-center text-xs text-[#465A4E]">
          {mode === 'login' ? (
            <>
              New to FieldShift?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  onSwitchMode('register');
                }}
                className="font-bold text-[#1B4332] hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  onSwitchMode('login');
                }}
                className="font-bold text-[#1B4332] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
