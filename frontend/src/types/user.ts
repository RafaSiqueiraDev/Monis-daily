export interface UserRead {
  id: string;
  name: string;
  email: string;
  created_at: string;
  active_countries: string[];
  onboarding_completed: boolean;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  invite_code: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}