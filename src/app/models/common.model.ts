export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
}
