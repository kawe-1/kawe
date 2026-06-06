export interface UserProfile {
  name: string;
  bio: string;
  avatar: string;
  subjects?: string[];
  style?: string;
}

export type AuthStateStatus = 'landing' | 'signin' | 'onboarding' | 'app';
