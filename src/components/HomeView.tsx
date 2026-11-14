import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { AppView, PlanTierId, SUBSCRIPTION_PLANS, UserAccount } from '../types';

interface HomeViewProps {
  onNavigate: (view: AppView, anchor?: string) => void;
  onSelectPlanForRegister: (planId: PlanTierId) => void;
  user: UserAccount | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onSelectPlanForRegister,
  user,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="bg-[#F8FAF7] text-[#111C16]">
      {/* Hero Section */}
      <section className="mx-auto max-w-[1160px] px-4 pt-16 pb-16 sm:px-6 sm:pt-24 sm:pb-20">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#0B3D91]">
            NASA Space Apps Challenge · Team Overachiever
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-[#111C16] leading-[1.1] [text-wrap:balance]">
            Adapt crop rotations with NASA satellite soil, rain, and heat data.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[#354A3E] leading-relaxed max-w-2xl">
            FieldShift turns complex Earth observations into plain-language planting decisions—helping farmers spot bare-soil erosion windows, test drought scenarios, and compare resilient crop rotations before the season starts.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#1B4332] px-5 text-sm font-semibold text-white hover:bg-[#2D6A4F] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]"
            >
              <span>Open Field Workspace</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
            {!user && (
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="inline-flex h-11 items-center rounded-lg border border-[#CBD5C7] bg-white px-5 text-sm font-semibold text-[#111C16] hover:bg-[#EFF5F1] transition-colors cursor-pointer"
              >
                Create Free Account
              </button>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-[#465A4E]">
            <span>SMAP Soil Moisture</span>
            <span aria-hidden="true">·</span>
            <span>MODIS NDVI Cover</span>
            <span aria-hidden="true">·</span>
            <span>GPM Rainfall Extremes</span>
            <span aria-hidden="true">·</span>
            <span>SRTM Elevation Slope</span>
            <span aria-hidden="true">·</span>
            <span>ECOSTRESS Surface Temp</span>
          </div>
        </div>
      </section>

      {/* Project Description / How It Works */}
      <section className="border-t border-[#E2E8DF] bg-white">
        <div className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111C16]">
              Built for outdoor clarity, not scientific overwhelm.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#354A3E]">
              Every satellite layer maps directly to a practical farming question.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <div className="font-mono text-xs font-bold text-[#2D6A4F]">01.</div>
              <h3 className="mt-2 text-lg font-bold text-[#111C16]">
                Inspect Plot Risk Windows
              </h3>
              <p className="mt-2 text-sm text-[#354A3E] leading-relaxed">
                Overlay SMAP root moisture, MODIS green cover, and GPM storm spikes on a 12-month timeline to see exactly when bare dirt faces washout or heat stress.
              </p>
            </div>

            <div>
              <div className="font-mono text-xs font-bold text-[#2D6A4F]">02.</div>
              <h3 className="mt-2 text-lg font-bold text-[#111C16]">
                Simulate Tough Seasons
              </h3>
              <p className="mt-2 text-sm text-[#354A3E] leading-relaxed">
                Adjust weights for water conservation, erosion, soil nutrients, and income—then test a -20% drought, +2°C heatwave, or native seed substitution.
              </p>
            </div>

            <div>
              <div className="font-mono text-xs font-bold text-[#2D6A4F]">03.</div>
              <h3 className="mt-2 text-lg font-bold text-[#111C16]">
                Verify Locally Before Planting
              </h3>
              <p className="mt-2 text-sm text-[#354A3E] leading-relaxed">
                Compare ranked strategies with smart fertilizer timing, inspect satellite data limits transparently, and ground-check pH and seed supply nearby.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section id="plans" className="border-t border-[#E2E8DF] bg-[#F8FAF7]">
        <div className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111C16]">
                Simple, transparent plans
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-[#354A3E]">
                Free forever for smallholder plots. Upgrade when coordinating co-ops or watersheds.
              </p>
            </div>

            {/* Billing Cycle Segmented Control */}
            <div
              role="group"
              aria-label="Billing cadence"
              className="inline-flex h-10 items-center self-start rounded-lg border border-[#CBD5C7] bg-[#EEF2EC] p-1"
            >
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                aria-pressed={billingCycle === 'monthly'}
                className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-[#111C16] shadow-xs'
                    : 'text-[#354A3E] hover:text-[#111C16]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                aria-pressed={billingCycle === 'annual'}
                className={`h-8 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-white text-[#111C16] shadow-xs'
                    : 'text-[#354A3E] hover:text-[#111C16]'
                }`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
              const isCurrent = user?.planId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`flex flex-col justify-between rounded-xl border bg-white p-6 ${
                    plan.highlighted
                      ? 'border-[#1B4332] ring-1 ring-[#1B4332]'
                      : 'border-[#D4DDD0]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-[#2D6A4F]">
                      {plan.targetAudience}
                    </div>
                    <h3 className="mt-1 text-xl font-extrabold text-[#111C16]">{plan.name}</h3>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-mono text-3xl font-extrabold text-[#111C16] tabular-nums">
                        ${price}
                      </span>
                      <span className="text-xs text-[#465A4E]">
                        {price === 0 ? 'forever' : '/ month'}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-[#354A3E] leading-relaxed">
                      {plan.description}
                    </p>

                    <ul className="mt-6 space-y-2.5 border-t border-[#E2E8DF] pt-5 text-sm text-[#1F2E25]">
                      {plan.limits.map((limit) => (
                        <li key={limit} className="flex items-start gap-2.5">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4332]"
                            aria-hidden="true"
                          />
                          <span>{limit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        onSelectPlanForRegister(plan.id);
                      } else {
                        onSelectPlanForRegister(plan.id);
                      }
                    }}
                    className={`mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      isCurrent
                        ? 'border border-[#1B4332] bg-[#EFF5F1] text-[#1B4332]'
                        : plan.highlighted
                          ? 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]'
                          : 'border border-[#CBD5C7] bg-white text-[#111C16] hover:bg-[#F3F6F1]'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : price === 0 ? 'Start Free' : `Choose ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-[#E2E8DF] bg-white">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-3 px-4 py-8 text-xs text-[#465A4E] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <span className="font-bold text-[#1B4332]">FieldShift</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Built by Team Overachiever for the NASA Space Apps Challenge</span>
          </div>
          <div>
            Supports—and never replaces—farmer judgment and local extension expertise.
          </div>
        </div>
      </footer>
    </div>
  );
};
