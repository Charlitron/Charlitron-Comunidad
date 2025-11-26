


export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  companyCode: string;
  type: 'ADMIN' | 'OPERATIVE';
  points?: number; // Gamification
  completedCourses?: string[]; // IDs of completed courses
  location?: {
    lat: number;
    lng: number;
    address?: string; // Optional text address if we had reverse geocoding
  };
}

export interface Company {
  name: string;
  code: string;
  email: string;
  logo?: string;
  description?: string;
  industry?: string;
  credits: number; // BUSINESS MODEL: Currency to view reports
  plan: 'FREE' | 'PREMIUM';
  isVerified?: boolean; // SECURITY: Can only post if verified
}

export interface CreditCode {
  code: string;
  amount: number;
  isRedeemed: boolean;
  redeemedBy?: string; // Company Code
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  companyName: string;
  companyCode: string;
  location: string;
  salary: string;
  type: 'ADMIN' | 'OPERATIVE'; // Determines the test type
  description: string;
  tags: string[];
  active: boolean;
  isFeatured?: boolean; // BUSINESS MODEL: True for Premium companies
  createdAt?: string;
}

export interface CourseQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  provider: string; // Could be company name
  companyCode?: string; // If created by company
  duration: string;
  points: number;
  image: string;
  category: string;
  videoUrl?: string; // YouTube/Vimeo Embed URL
  quiz?: CourseQuestion[];
}

export interface Assessment {
  id: string;
  candidateId: string;
  companyCode: string;
  jobId?: string; // Link to specific job
  answers: Answers;
  status: 'PENDING' | 'ANALYZING' | 'COMPLETED' | 'ERROR';
  report?: AnalysisReport;
  timestamp: string;
  candidateType: 'ADMIN' | 'OPERATIVE';
  isUnlocked?: boolean; // BUSINESS MODEL: True if company paid credit to see it
}

export interface QuestionBlock {
  id: string;
  title: string;
  description: string;
  questions: string[];
}

export type Answers = Record<string, string>;

// Structure matching the AI JSON Output
export interface AnalysisReport {
  scores: {
    aptitude: number;
    integrity: number;
    performancePotential: number;
    culturalFit: number;
    flightRisk: number;
  };
  psychology: {
    mbti: string;
    bigFive: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    enneagram?: string;
  };
  emotionalIntelligence: {
    selfAwareness: number;
    selfRegulation: number;
    empathy: number;
    motivation: number;
    socialSkills: number;
  };
  coherence: {
    score: number;
    narrativeAnalysis: string;
    honestyScore: number;
    honestyAnalysis: string;
    inconsistencies: string[];
    locusOfControl: 'Internal' | 'External';
  };
  leadership: {
    primaryStyle: string;
    secondaryStyle?: string;
    strengths: string[];
    weaknesses: string[];
    developmentPlan: string;
  };
  flags: {
    redFlags: string[];
    greenFlags: string[];
  };
  motivation: {
    surfaceLevel: string;
    deepLevel: string;
    roleAlignment: boolean;
    retentionRiskLevel: 'Low' | 'Medium' | 'High';
  };
  recommendation: {
    decision: 'HIRE' | 'VALIDATE' | 'REJECT';
    reason: string;
    nextSteps: string[];
  };
}

export interface ActivityData {
    name: string;
    solicitudes: number;
}