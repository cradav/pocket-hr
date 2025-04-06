// Career pathway types and interfaces

export interface Skill {
  id: string;
  name: string;
  category: "hard" | "soft";
  level: "beginner" | "intermediate" | "advanced" | "expert";
  relevance: number; // 0-100 score of how relevant this skill is to a role
}

export interface Role {
  id: string;
  title: string;
  description: string;
  industry: string;
  requiredSkills: Skill[];
  preferredSkills: Skill[];
  averageSalary: {
    min: number;
    max: number;
    currency: string;
  };
  growthPotential: number; // Percentage of projected industry growth
  timeToAchieve: string; // e.g., "6-12 months"
  riskLevel: "Low" | "Medium" | "High";
  matchScore: number; // 0-10 score of how well the user matches this role
}

export interface JobListing {
  id: string;
  roleId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  skillsMatch: {
    matched: number;
    total: number;
  };
  toolsMatch: {
    matched: number;
    total: number;
  };
  applyLinks: {
    platform: string;
    url: string;
  }[];
  postedDate: Date;
}

export interface CareerPathway {
  id: string;
  type: "vertical" | "diagonal" | "leap";
  description: string;
  timeRequired: string;
  salaryChangeRange: string;
  riskLevel: "Low" | "Medium" | "High";
  roles: Role[];
  color: string;
  icon: string;
}

export interface ResumeData {
  skills: Skill[];
  experience: {
    title: string;
    company: string;
    duration: number; // in months
    description: string;
    skills: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  certifications: string[];
  industries: string[];
}

export interface CareerPathwayGenerationRequest {
  resumeFile?: File;
  resumeText?: string;
  currentRole?: string;
  desiredIndustries?: string[];
  locationPreference?: string;
  salaryExpectation?: number;
  timeframe?: string;
  priorityFactors?: (
    | "salary"
    | "work-life-balance"
    | "growth"
    | "stability"
    | "remote"
  )[];
}

export interface CareerPathwayGenerationResponse {
  pathways: CareerPathway[];
  resumeAnalysis: {
    extractedSkills: Skill[];
    tenurePatterns: string;
    industryKeywords: string[];
    educationLevel: string;
    certifications: string[];
    strengths: string[];
    gaps: string[];
  };
  creditsUsed: number;
}
