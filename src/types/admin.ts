// User-related types
export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: UserRole;
  status: UserStatus;
  planId: string;
  createdAt: string;
  lastLogin: string;
  wordCredits: {
    remaining: number;
    total: number;
  };
  avatar?: string;
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

// Plan-related types
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: BillingCycle;
  features: PlanFeature[];
  wordCredits: number;
  isActive: boolean;
}

export enum BillingCycle {
  MONTHLY = "monthly",
  ANNUAL = "annual",
  QUARTERLY = "quarterly",
}

export interface PlanFeature {
  name: string;
  included: boolean;
  feature_limit?: number;
}
