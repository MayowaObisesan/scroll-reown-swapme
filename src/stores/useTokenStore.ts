import { create } from 'zustand';
import { TokenBalance } from '../types/token';

interface TokenStore {
  tokens: TokenBalance[];
  loading: boolean;
  error: string | null;
  setTokens: (tokens: TokenBalance[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTokenStore = create<TokenStore>((set) => ({
  tokens: [],
  loading: false,
  error: null,
  setTokens: (tokens) => set({ tokens }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
