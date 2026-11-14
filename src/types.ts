export type AppView = 'home' | 'workspace' | 'login' | 'register';

export type PlanTierId = 'free' | 'coop-pro' | 'extension';

export interface SubscriptionPlan {
  id: PlanTierId;
  name: string;
  targetAudience: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  limits: string[];
  highlighted?: boolean;
}

export interface UserAccount {
  name: string;
  email: string;
  farmName: string;
  planId: PlanTierId;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Smallholder Free',
    targetAudience: 'For individual farmers & single plots',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Essential NASA seasonal risk timelines and crop rotation scoring for up to 2 farm plots.',
    limits: [
      'Up to 2 farm plots (10 ha max)',
      'SMAP, MODIS NDVI, GPM & SRTM overlays',
      'Climate stress simulator (-20% rain, +2°C heat)',
      'Plain-English audio readout & field brief export',
    ],
  },
  {
    id: 'coop-pro',
    name: 'Farm Co-op Pro',
    targetAudience: 'For farmer cooperatives & multi-plot estates',
    monthlyPrice: 14,
    annualPrice: 11,
    description: 'Full multi-plot rotation planning, shared co-op seed substitution, and seasonal SMS field briefs.',
    limits: [
      'Up to 25 farm plots (250 ha total)',
      'Custom crop rotation & native seed catalog',
      '10-year historical anomaly comparison',
      'Priority local soil lab & supply directory sync',
    ],
    highlighted: true,
  },
  {
    id: 'extension',
    name: 'Extension & Regional',
    targetAudience: 'For municipal agronomists & NGOs',
    monthlyPrice: 49,
    annualPrice: 39,
    description: 'District-wide vulnerability mapping, extension officer validation logs, and bulk farmer briefs.',
    limits: [
      'Unlimited plots across municipal watersheds',
      'Batch PDF / SMS farmer brief generation',
      'Extension officer verification & field notes archive',
      'CSV & GeoJSON telemetry export',
    ],
  },
];
