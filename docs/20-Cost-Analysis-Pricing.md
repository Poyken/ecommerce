# Phân tích Chi phí & Mô hình Giá cả
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Tài chính  
**Trạng thái**: Bản nháp  

---

### Tổng quan về Chi phí

#### Phân loại Chi phí

**1. Chi phí Phát triển (Development Costs)**
- Nhân sự phát triển
- Infrastructure và tools
- Testing và QA
- Project management

**2. Chi phí Vận hành (Operational Costs)**
- Cloud infrastructure
- Third-party services
- Monitoring và logging
- Security và compliance

**3. Chi phí Marketing & Sales**
- Digital marketing
- Sales team
- Customer support
- Content creation

**4. Chi phí Administrative**
- Legal và compliance
- Accounting và finance
- Office và utilities
- Insurance

---

### Chi phí Phát triển

#### Nhân sự Phát triển

**1. Team Composition**
```typescript
// cost-analysis/team-composition.ts
export interface TeamMember {
  role: string;
  experience: 'junior' | 'mid' | 'senior' | 'lead';
  monthlySalary: number;
  annualCost: number;
  benefits: number;
}

export const developmentTeam: TeamMember[] = [
  {
    role: 'Tech Lead',
    experience: 'senior',
    monthlySalary: 8000,
    annualCost: 96000,
    benefits: 24000,
  },
  {
    role: 'Backend Developer',
    experience: 'mid',
    monthlySalary: 6000,
    annualCost: 72000,
    benefits: 18000,
  },
  {
    role: 'Frontend Developer',
    experience: 'mid',
    monthlySalary: 5500,
    annualCost: 66000,
    benefits: 16500,
  },
  {
    role: 'Database Engineer',
    experience: 'senior',
    monthlySalary: 7000,
    annualCost: 84000,
    benefits: 21000,
  },
  {
    role: 'DevOps Engineer',
    experience: 'mid',
    monthlySalary: 6500,
    annualCost: 78000,
    benefits: 19500,
  },
  {
    role: 'UI/UX Designer',
    experience: 'mid',
    monthlySalary: 5000,
    annualCost: 60000,
    benefits: 15000,
  },
  {
    role: 'QA Engineer',
    experience: 'mid',
    monthlySalary: 4500,
    annualCost: 54000,
    benefits: 13500,
  },
  {
    role: 'Project Manager',
    experience: 'senior',
    monthlySalary: 7000,
    annualCost: 84000,
    benefits: 21000,
  },
];

export function calculateTeamCosts(team: TeamMember[]): TeamCosts {
  const totalSalary = team.reduce((sum, member) => sum + member.annualCost, 0);
  const totalBenefits = team.reduce((sum, member) => sum + member.benefits, 0);
  const totalCost = totalSalary + totalBenefits;
  
  return {
    teamSize: team.length,
    totalSalary,
    totalBenefits,
    totalCost,
    averageCostPerMember: totalCost / team.length,
  };
}

interface TeamCosts {
  teamSize: number;
  totalSalary: number;
  totalBenefits: number;
  totalCost: number;
  averageCostPerMember: number;
}
```

**2. Development Timeline Costs**
```typescript
// cost-analysis/development-costs.ts
export interface PhaseCost {
  phase: string;
  duration: number; // months
  teamMembers: number;
  monthlyCost: number;
  totalCost: number;
}

export const developmentPhases: PhaseCost[] = [
  {
    phase: 'Planning & Architecture',
    duration: 2,
    teamMembers: 3,
    monthlyCost: 21000,
    totalCost: 42000,
  },
  {
    phase: 'Core Development',
    duration: 6,
    teamMembers: 8,
    monthlyCost: 56000,
    totalCost: 336000,
  },
  {
    phase: 'Testing & QA',
    duration: 2,
    teamMembers: 6,
    monthlyCost: 42000,
    totalCost: 84000,
  },
  {
    phase: 'Deployment & Launch',
    duration: 1,
    teamMembers: 5,
    monthlyCost: 35000,
    totalCost: 35000,
  },
  {
    phase: 'Post-Launch Support',
    duration: 3,
    teamMembers: 4,
    monthlyCost: 28000,
    totalCost: 84000,
  },
];

export function calculateTotalDevelopmentCost(): DevelopmentCostSummary {
  const totalDuration = developmentPhases.reduce((sum, phase) => sum + phase.duration, 0);
  const totalCost = developmentPhases.reduce((sum, phase) => sum + phase.totalCost, 0);
  
  return {
    totalDuration,
    totalCost,
    averageMonthlyCost: totalCost / totalDuration,
    phases: developmentPhases,
  };
}

interface DevelopmentCostSummary {
  totalDuration: number;
  totalCost: number;
  averageMonthlyCost: number;
  phases: PhaseCost[];
}
```

#### Infrastructure & Tools Costs

**1. Development Tools**
```typescript
// cost-analysis/infrastructure-costs.ts
export interface ToolCost {
  name: string;
  category: 'development' | 'testing' | 'monitoring' | 'security';
  pricingModel: 'monthly' | 'annual' | 'usage-based';
  monthlyCost: number;
  annualCost: number;
  userLimit?: number;
}

export const developmentTools: ToolCost[] = [
  {
    name: 'GitHub Enterprise',
    category: 'development',
    pricingModel: 'monthly',
    monthlyCost: 25,
    annualCost: 300,
    userLimit: 8,
  },
  {
    name: 'Jira',
    category: 'development',
    pricingModel: 'monthly',
    monthlyCost: 7.50,
    annualCost: 90,
    userLimit: 8,
  },
  {
    name: 'Slack',
    category: 'development',
    pricingModel: 'monthly',
    monthlyCost: 8.75,
    annualCost: 105,
    userLimit: 8,
  },
  {
    name: 'Figma',
    category: 'development',
    pricingModel: 'monthly',
    monthlyCost: 15,
    annualCost: 180,
    userLimit: 3,
  },
  {
    name: 'Datadog',
    category: 'monitoring',
    pricingModel: 'usage-based',
    monthlyCost: 500,
    annualCost: 6000,
  },
  {
    name: 'Sentry',
    category: 'monitoring',
    pricingModel: 'usage-based',
    monthlyCost: 200,
    annualCost: 2400,
  },
];

export function calculateToolCosts(tools: ToolCost[]): ToolCostSummary {
  const totalMonthlyCost = tools.reduce((sum, tool) => sum + tool.monthlyCost, 0);
  const totalAnnualCost = tools.reduce((sum, tool) => sum + tool.annualCost, 0);
  
  const costsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = 0;
    }
    acc[tool.category] += tool.annualCost;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalMonthlyCost,
    totalAnnualCost,
    costsByCategory,
    tools,
  };
}

interface ToolCostSummary {
  totalMonthlyCost: number;
  totalAnnualCost: number;
  costsByCategory: Record<string, number>;
  tools: ToolCost[];
}
```

---

### Chi phí Vận hành

#### Cloud Infrastructure Costs

**1. AWS Infrastructure**
```typescript
// cost-analysis/aws-costs.ts
export interface AWSService {
  service: string;
  component: string;
  pricingModel: 'on-demand' | 'reserved' | 'spot';
  monthlyCost: number;
  annualCost: number;
  specifications: Record<string, any>;
}

export const awsServices: AWSService[] = [
  {
    service: 'EC2',
    component: 'Application Servers (4x t3.large)',
    pricingModel: 'reserved',
    monthlyCost: 400,
    annualCost: 4800,
    specifications: {
      instances: 4,
      type: 't3.large',
      vcpu: 2,
      memory: '8GB',
    },
  },
  {
    service: 'RDS',
    component: 'PostgreSQL Database',
    pricingModel: 'reserved',
    monthlyCost: 350,
    annualCost: 4200,
    specifications: {
      instance: 'db.r5.large',
      storage: '500GB SSD',
      backup: 'Enabled',
    },
  },
  {
    service: 'ElastiCache',
    component: 'Redis Cluster',
    pricingModel: 'reserved',
    monthlyCost: 200,
    annualCost: 2400,
    specifications: {
      nodes: 3,
      type: 'cache.r5.large',
      memory: '13GB',
    },
  },
  {
    service: 'S3',
    component: 'Object Storage',
    pricingModel: 'usage-based',
    monthlyCost: 150,
    annualCost: 1800,
    specifications: {
      storage: '1TB',
      requests: '10M/month',
    },
  },
  {
    service: 'CloudFront',
    component: 'CDN',
    pricingModel: 'usage-based',
    monthlyCost: 100,
    annualCost: 1200,
    specifications: {
      dataTransfer: '500GB/month',
      requests: '5M/month',
    },
  },
  {
    service: 'Load Balancer',
    component: 'Application Load Balancer',
    pricingModel: 'usage-based',
    monthlyCost: 50,
    annualCost: 600,
    specifications: {
      instances: 2,
      dataProcessing: '1TB/month',
    },
  },
];

export function calculateAWSCosts(services: AWSService[]): AWSCostSummary {
  const totalMonthlyCost = services.reduce((sum, service) => sum + service.monthlyCost, 0);
  const totalAnnualCost = services.reduce((sum, service) => sum + service.annualCost, 0);
  
  const costsByService = services.reduce((acc, service) => {
    if (!acc[service.service]) {
      acc[service.service] = 0;
    }
    acc[service.service] += service.annualCost;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalMonthlyCost,
    totalAnnualCost,
    costsByService,
    services,
  };
}

interface AWSCostSummary {
  totalMonthlyCost: number;
  totalAnnualCost: number;
  costsByService: Record<string, number>;
  services: AWSService[];
}
```

**2. Third-party Services Costs**
```typescript
// cost-analysis/third-party-costs.ts
export interface ThirdPartyService {
  name: string;
  category: 'payment' | 'email' | 'sms' | 'analytics' | 'storage' | 'monitoring';
  pricingModel: 'tiered' | 'usage-based' | 'subscription';
  baseCost: number;
  variableCost: number;
  estimatedMonthlyCost: number;
  estimatedAnnualCost: number;
}

export const thirdPartyServices: ThirdPartyService[] = [
  {
    name: 'Stripe',
    category: 'payment',
    pricingModel: 'usage-based',
    baseCost: 0,
    variableCost: 0.029, // 2.9% + $0.30 per transaction
    estimatedMonthlyCost: 500,
    estimatedAnnualCost: 6000,
  },
  {
    name: 'SendGrid',
    category: 'email',
    pricingModel: 'tiered',
    baseCost: 15,
    variableCost: 0.001, // $0.001 per email beyond 100k
    estimatedMonthlyCost: 100,
    estimatedAnnualCost: 1200,
  },
  {
    name: 'Twilio',
    category: 'sms',
    pricingModel: 'usage-based',
    baseCost: 0,
    variableCost: 0.08, // $0.08 per SMS
    estimatedMonthlyCost: 80,
    estimatedAnnualCost: 960,
  },
  {
    name: 'Google Analytics',
    category: 'analytics',
    pricingModel: 'subscription',
    baseCost: 0,
    variableCost: 0,
    estimatedMonthlyCost: 0,
    estimatedAnnualCost: 0,
  },
  {
    name: 'Datadog',
    category: 'monitoring',
    pricingModel: 'usage-based',
    baseCost: 15,
    variableCost: 0.50, // per host
    estimatedMonthlyCost: 500,
    estimatedAnnualCost: 6000,
  },
];

export function calculateThirdPartyCosts(
  services: ThirdPartyService[]
): ThirdPartyCostSummary {
  const totalMonthlyCost = services.reduce((sum, service) => sum + service.estimatedMonthlyCost, 0);
  const totalAnnualCost = services.reduce((sum, service) => sum + service.estimatedAnnualCost, 0);
  
  const costsByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = 0;
    }
    acc[service.category] += service.annualCost;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalMonthlyCost,
    totalAnnualCost,
    costsByCategory,
    services,
  };
}

interface ThirdPartyCostSummary {
  totalMonthlyCost: number;
  totalAnnualCost: number;
  costsByCategory: Record<string, number>;
  services: ThirdPartyService[];
}
```

---

### Mô hình Giá cả

#### Pricing Strategy

**1. Tier-based Pricing**
```typescript
// pricing/pricing-tiers.ts
export interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: PricingFeature[];
  limits: PricingLimits;
  targetMarket: string;
}

export interface PricingFeature {
  name: string;
  included: boolean;
  description: string;
}

export interface PricingLimits {
  products: number;
  orders: number;
  users: number;
  storage: string;
  bandwidth: string;
  apiCalls: number;
}

export const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      { name: 'Multi-tenant Architecture', included: true, description: 'Isolated tenant environment' },
      { name: 'Basic E-commerce Features', included: true, description: 'Products, orders, customers' },
      { name: 'Payment Processing', included: true, description: 'Stripe integration' },
      { name: 'Basic Analytics', included: true, description: 'Sales reports and basic metrics' },
      { name: 'Email Support', included: true, description: 'Email support during business hours' },
      { name: 'Custom Domain', included: false, description: 'Custom domain support' },
      { name: 'API Access', included: false, description: 'Full API access' },
      { name: 'Advanced Analytics', included: false, description: 'Advanced analytics and reporting' },
    ],
    limits: {
      products: 100,
      orders: 500,
      users: 3,
      storage: '1GB',
      bandwidth: '10GB',
      apiCalls: 1000,
    },
    targetMarket: 'Small businesses, startups',
  },
  {
    name: 'Professional',
    monthlyPrice: 99,
    annualPrice: 990,
    features: [
      { name: 'Multi-tenant Architecture', included: true, description: 'Isolated tenant environment' },
      { name: 'Advanced E-commerce Features', included: true, description: 'All features plus inventory management' },
      { name: 'Multiple Payment Gateways', included: true, description: 'Stripe, PayPal, Square' },
      { name: 'Advanced Analytics', included: true, description: 'Advanced analytics and reporting' },
      { name: 'Priority Support', included: true, description: '24/7 priority support' },
      { name: 'Custom Domain', included: true, description: 'Custom domain support' },
      { name: 'API Access', included: true, description: 'Full API access' },
      { name: 'Third-party Integrations', included: true, description: 'Email, SMS, shipping' },
    ],
    limits: {
      products: 1000,
      orders: 5000,
      users: 10,
      storage: '10GB',
      bandwidth: '100GB',
      apiCalls: 10000,
    },
    targetMarket: 'Growing businesses, medium enterprises',
  },
  {
    name: 'Enterprise',
    monthlyPrice: 299,
    annualPrice: 2990,
    features: [
      { name: 'Multi-tenant Architecture', included: true, description: 'Isolated tenant environment' },
      { name: 'All Features', included: true, description: 'All platform features' },
      { name: 'Custom Integrations', included: true, description: 'Custom integration development' },
      { name: 'Dedicated Support', included: true, description: 'Dedicated account manager' },
      { name: 'SLA Guarantee', included: true, description: '99.9% uptime SLA' },
      { name: 'Custom Domain', included: true, description: 'Multiple custom domains' },
      { name: 'Advanced API', included: true, description: 'Advanced API with webhooks' },
      { name: 'White-label Option', included: true, description: 'White-label customization' },
    ],
    limits: {
      products: -1, // Unlimited
      orders: -1,
      users: -1,
      storage: '100GB',
      bandwidth: '1TB',
      apiCalls: 100000,
    },
    targetMarket: 'Large enterprises, high-volume businesses',
  },
];

export function calculateRevenueProjections(
  tiers: PricingTier[],
  customerProjections: CustomerProjection[]
): RevenueProjection {
  const monthlyRevenue = customerProjections.reduce((sum, projection) => {
    const tier = tiers.find(t => t.name === projection.tier);
    return sum + (tier?.monthlyPrice || 0) * projection.customers;
  }, 0);

  const annualRevenue = monthlyRevenue * 12;
  
  const revenueByTier = customerProjections.map(projection => {
    const tier = tiers.find(t => t.name === projection.tier);
    return {
      tier: projection.tier,
      customers: projection.customers,
      monthlyRevenue: (tier?.monthlyPrice || 0) * projection.customers,
      annualRevenue: (tier?.annualPrice || 0) * projection.customers,
    };
  });

  return {
    monthlyRevenue,
    annualRevenue,
    revenueByTier,
  };
}

interface CustomerProjection {
  tier: string;
  customers: number;
}

interface RevenueProjection {
  monthlyRevenue: number;
  annualRevenue: number;
  revenueByTier: Array<{
    tier: string;
    customers: number;
    monthlyRevenue: number;
    annualRevenue: number;
  }>;
}
```

**2. Usage-based Pricing**
```typescript
// pricing/usage-based-pricing.ts
export interface UsageMetric {
  name: string;
  unit: string;
  basePrice: number;
  includedInTier: Record<string, number>;
  overagePrice: number;
}

export const usageMetrics: UsageMetric[] = [
  {
    name: 'API Calls',
    unit: 'call',
    basePrice: 0,
    includedInTier: {
      'Starter': 1000,
      'Professional': 10000,
      'Enterprise': 100000,
    },
    overagePrice: 0.001, // $0.001 per call
  },
  {
    name: 'Storage',
    unit: 'GB',
    basePrice: 0,
    includedInTier: {
      'Starter': 1,
      'Professional': 10,
      'Enterprise': 100,
    },
    overagePrice: 0.50, // $0.50 per GB
  },
  {
    name: 'Bandwidth',
    unit: 'GB',
    basePrice: 0,
    includedInTier: {
      'Starter': 10,
      'Professional': 100,
      'Enterprise': 1000,
    },
    overagePrice: 0.10, // $0.10 per GB
  },
  {
    name: 'Transactions',
    unit: 'transaction',
    basePrice: 0,
    includedInTier: {
      'Starter': 500,
      'Professional': 5000,
      'Enterprise': 50000,
    },
    overagePrice: 0.02, // $0.02 per transaction
  },
];

export function calculateUsageCosts(
  tier: string,
  usage: Record<string, number>
): UsageCostBreakdown {
  const costs: UsageCostDetail[] = [];
  let totalCost = 0;

  for (const metric of usageMetrics) {
    const included = metric.includedInTier[tier] || 0;
    const used = usage[metric.name] || 0;
    const overage = Math.max(0, used - included);
    const cost = overage * metric.overagePrice;

    costs.push({
      metric: metric.name,
      included,
      used,
      overage,
      unitPrice: metric.overagePrice,
      cost,
    });

    totalCost += cost;
  }

  return {
    totalCost,
    costs,
  };
}

interface UsageCostDetail {
  metric: string;
  included: number;
  used: number;
  overage: number;
  unitPrice: number;
  cost: number;
}

interface UsageCostBreakdown {
  totalCost: number;
  costs: UsageCostDetail[];
}
```

---

### Phân tích Tài chính

#### ROI Analysis

**1. Investment vs Return**
```typescript
// financial/roi-analysis.ts
export interface Investment {
  category: string;
  amount: number;
  timeframe: 'one-time' | 'monthly' | 'annual';
  description: string;
}

export interface RevenueStream {
  source: string;
  amount: number;
  growthRate: number;
  timeframe: 'monthly' | 'annual';
}

export function calculateROI(
  investments: Investment[],
  revenues: RevenueStream[],
  timeframe: number // months
): ROIAnalysis {
  const totalInvestment = investments.reduce((sum, inv) => {
    if (inv.timeframe === 'one-time') return sum + inv.amount;
    if (inv.timeframe === 'monthly') return sum + inv.amount * timeframe;
    if (inv.timeframe === 'annual') return sum + inv.amount * (timeframe / 12);
    return sum;
  }, 0);

  const totalRevenue = revenues.reduce((sum, rev) => {
    if (rev.timeframe === 'monthly') return sum + rev.amount * timeframe;
    if (rev.timeframe === 'annual') return sum + rev.amount * (timeframe / 12);
    return sum;
  }, 0);

  const netProfit = totalRevenue - totalInvestment;
  const roiPercentage = (netProfit / totalInvestment) * 100;
  const paybackPeriod = totalInvestment / (totalRevenue / timeframe);

  return {
    totalInvestment,
    totalRevenue,
    netProfit,
    roiPercentage,
    paybackPeriod,
    timeframe,
  };
}

interface ROIAnalysis {
  totalInvestment: number;
  totalRevenue: number;
  netProfit: number;
  roiPercentage: number;
  paybackPeriod: number;
  timeframe: number;
}
```

**2. Break-even Analysis**
```typescript
// financial/break-even-analysis.ts
export interface CostStructure {
  fixedCosts: FixedCost[];
  variableCosts: VariableCost[];
}

export interface FixedCost {
  name: string;
  amount: number;
  frequency: 'monthly' | 'annual';
}

export interface VariableCost {
  name: string;
  perUnitCost: number;
  description: string;
}

export function calculateBreakEven(
  costStructure: CostStructure,
  pricePerUnit: number
): BreakEvenAnalysis {
  const totalFixedCosts = costStructure.fixedCosts.reduce((sum, cost) => {
    return sum + (cost.frequency === 'monthly' ? cost.amount * 12 : cost.amount);
  }, 0);

  const totalVariableCostPerUnit = costStructure.variableCosts.reduce(
    (sum, cost) => sum + cost.perUnitCost,
    0
  );

  const contributionMargin = pricePerUnit - totalVariableCostPerUnit;
  const breakEvenUnits = totalFixedCosts / contributionMargin;
  const breakEvenRevenue = breakEvenUnits * pricePerUnit;

  return {
    totalFixedCosts,
    totalVariableCostPerUnit,
    contributionMargin,
    breakEvenUnits,
    breakEvenRevenue,
  };
}

interface BreakEvenAnalysis {
  totalFixedCosts: number;
  totalVariableCostPerUnit: number;
  contributionMargin: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
}
```

---

### Projections & Forecasts

**1. Customer Growth Projections**
```typescript
// projections/customer-growth.ts
export interface CustomerGrowthModel {
  initialCustomers: number;
  monthlyGrowthRate: number;
  churnRate: number;
  tierDistribution: Record<string, number>;
}

export function projectCustomerGrowth(
  model: CustomerGrowthModel,
  months: number
): CustomerGrowthProjection[] {
  const projections: CustomerGrowthProjection[] = [];
  let currentCustomers = model.initialCustomers;

  for (let month = 1; month <= months; month++) {
    const newCustomers = Math.floor(currentCustomers * model.monthlyGrowthRate);
    const churnedCustomers = Math.floor(currentCustomers * model.churnRate);
    const netCustomers = newCustomers - churnedCustomers;
    currentCustomers += netCustomers;

    const customersByTier: Record<string, number> = {};
    for (const [tier, percentage] of Object.entries(model.tierDistribution)) {
      customersByTier[tier] = Math.floor(currentCustomers * percentage);
    }

    projections.push({
      month,
      totalCustomers: currentCustomers,
      newCustomers,
      churnedCustomers,
      netCustomers,
      customersByTier,
    });
  }

  return projections;
}

interface CustomerGrowthProjection {
  month: number;
  totalCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  netCustomers: number;
  customersByTier: Record<string, number>;
}
```

**2. Revenue Projections**
```typescript
// projections/revenue-projections.ts
export function projectRevenue(
  customerProjections: CustomerGrowthProjection[],
  pricingTiers: PricingTier[]
): RevenueProjection[] {
  return customerProjections.map(projection => {
    const monthlyRevenue = Object.entries(projection.customersByTier).reduce(
      (sum, [tierName, customers]) => {
        const tier = pricingTiers.find(t => t.name === tierName);
        return sum + (tier?.monthlyPrice || 0) * customers;
      },
      0
    );

    const annualRevenue = monthlyRevenue * 12;

    return {
      month: projection.month,
      totalCustomers: projection.totalCustomers,
      monthlyRevenue,
      annualRevenue,
      averageRevenuePerCustomer: monthlyRevenue / projection.totalCustomers,
    };
  });
}

interface RevenueProjection {
  month: number;
  totalCustomers: number;
  monthlyRevenue: number;
  annualRevenue: number;
  averageRevenuePerCustomer: number;
}
```

---

### Risk Analysis

**1. Financial Risks**
```typescript
// risk/financial-risks.ts
export interface FinancialRisk {
  name: string;
  category: 'cost' | 'revenue' | 'market' | 'operational';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

export const financialRisks: FinancialRisk[] = [
  {
    name: 'Infrastructure Cost Overrun',
    category: 'cost',
    probability: 'medium',
    impact: 'medium',
    description: 'Cloud infrastructure costs exceed projections due to unexpected usage patterns',
    mitigation: 'Implement cost monitoring and alerts, use reserved instances, optimize resource usage',
  },
  {
    name: 'Customer Churn Higher Than Expected',
    category: 'revenue',
    probability: 'medium',
    impact: 'high',
    description: 'Customer churn rate exceeds projections, impacting revenue growth',
    mitigation: 'Improve onboarding, add value-added features, implement retention strategies',
  },
  {
    name: 'Third-party Service Price Increases',
    category: 'cost',
    probability: 'medium',
    impact: 'medium',
    description: 'Essential third-party services increase prices unexpectedly',
    mitigation: 'Diversify service providers, negotiate long-term contracts, build in-house alternatives',
  },
  {
    name: 'Market Competition',
    category: 'market',
    probability: 'high',
    impact: 'high',
    description: 'New competitors enter market with lower pricing',
    mitigation: 'Differentiate on features and quality, focus on customer service, innovate continuously',
  },
];

export function assessFinancialRisks(
  risks: FinancialRisk[]
): RiskAssessment {
  const risksByCategory = risks.reduce((acc, risk) => {
    if (!acc[risk.category]) {
      acc[risk.category] = [];
    }
    acc[risk.category].push(risk);
    return acc;
  }, {} as Record<string, FinancialRisk[]>);

  const highImpactRisks = risks.filter(risk => risk.impact === 'high');
  const highProbabilityRisks = risks.filter(risk => risk.probability === 'high');

  return {
    totalRisks: risks.length,
    highImpactRisks: highImpactRisks.length,
    highProbabilityRisks: highProbabilityRisks.length,
    risksByCategory,
    risks,
  };
}

interface RiskAssessment {
  totalRisks: number;
  highImpactRisks: number;
  highProbabilityRisks: number;
  risksByCategory: Record<string, FinancialRisk[]>;
  risks: FinancialRisk[];
}
```

---

### Summary & Recommendations

**1. Cost Summary**
```typescript
// summary/cost-summary.ts
export function generateCostSummary(): CostSummary {
  const developmentCosts = calculateTotalDevelopmentCost();
  const toolCosts = calculateToolCosts(developmentTools);
  const awsCosts = calculateAWSCosts(awsServices);
  const thirdPartyCosts = calculateThirdPartyCosts(thirdPartyServices);

  const totalDevelopmentCost = developmentCosts.totalCost;
  const totalToolCost = toolCosts.totalAnnualCost;
  const totalInfrastructureCost = awsCosts.totalAnnualCost + thirdPartyCosts.totalAnnualCost;

  const totalFirstYearCost = totalDevelopmentCost + totalToolCost + totalInfrastructureCost;
  const annualOperatingCost = totalToolCost + totalInfrastructureCost;

  return {
    developmentCosts: totalDevelopmentCost,
    toolCosts: totalToolCost,
    infrastructureCosts: totalInfrastructureCost,
    totalFirstYearCost,
    annualOperatingCost,
    monthlyOperatingCost: annualOperatingCost / 12,
  };
}

interface CostSummary {
  developmentCosts: number;
  toolCosts: number;
  infrastructureCosts: number;
  totalFirstYearCost: number;
  annualOperatingCost: number;
  monthlyOperatingCost: number;
}
```

**2. Business Recommendations**
```typescript
// summary/recommendations.ts
export interface Recommendation {
  category: 'cost-optimization' | 'revenue-growth' | 'risk-mitigation' | 'strategic';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  implementation: string;
}

export const businessRecommendations: Recommendation[] = [
  {
    category: 'cost-optimization',
    priority: 'high',
    title: 'Optimize Cloud Infrastructure',
    description: 'Implement auto-scaling and use reserved instances to reduce AWS costs by 20-30%',
    expectedImpact: 'Reduce monthly infrastructure costs by $200-300',
    implementation: 'Configure auto-scaling groups, purchase 1-year reserved instances',
  },
  {
    category: 'revenue-growth',
    priority: 'high',
    title: 'Implement Usage-based Pricing',
    description: 'Add usage-based pricing tiers to capture high-value customers',
    expectedImpact: 'Increase average revenue per customer by 15-20%',
    implementation: 'Develop usage tracking system, update pricing page',
  },
  {
    category: 'risk-mitigation',
    priority: 'medium',
    title: 'Diversify Third-party Dependencies',
    description: 'Reduce dependency on single providers for critical services',
    expectedImpact: 'Improve service reliability and reduce vendor lock-in',
    implementation: 'Evaluate alternative providers, implement fallback mechanisms',
  },
  {
    category: 'strategic',
    priority: 'high',
    title: 'Focus on Customer Retention',
    description: 'Implement customer success programs to reduce churn',
    expectedImpact: 'Reduce churn rate from 5% to 3%, increase LTV',
    implementation: 'Hire customer success manager, implement NPS surveys',
  },
];
```

---

### Approval

**CFO**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________

**CEO**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________

**Board of Directors**: ___________________  
**Ngày**: ___________________  
**Chữ ký**: ___________________
