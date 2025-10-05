# Project Improvements

This document outlines suggested improvements for the SwapMe Web3 wallet management application to enhance code quality, user experience, performance, and maintainability.

## Critical Issues

### 🚨 High Priority

#### 1. Environment Variable Security
**Issue**: API key is hardcoded as string in `src/components/tokens/token.ts`
```typescript
// ❌ Current - Hardcoded API key
apiKey: "process.env.NEXT_PUBLIC_ALCHEMY_KEY"

// ✅ Should be
apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY
```
**Impact**: API key is treated as literal string, causing authentication failures.

#### 2. Network Configuration Mismatch
**Issue**: Token balance fetching uses `ETH_MAINNET` while app is configured for Scroll networks
```typescript
// ❌ Current in token.ts
network: Network.ETH_MAINNET

// ✅ Should be
network: Network.ETH_MAINNET // Only if supporting Ethereum, or create Scroll network config
```
**Impact**: Users on Scroll network won't see their token balances correctly.

#### 3. Missing Error Boundaries
**Issue**: No error boundaries around Web3 components that can fail unpredictably
**Impact**: App crashes when blockchain operations fail, poor user experience.

## Development Infrastructure

### Testing Framework
**Priority**: High

**Current State**: No testing setup detected
**Recommendation**: Add comprehensive testing infrastructure

```bash
# Add testing dependencies
yarn add -D vitest @testing-library/react @testing-library/jest-dom jsdom
yarn add -D @vitest/ui happy-dom
```

**Setup Files Needed**:
- `vitest.config.ts` - Test configuration
- `src/test/setup.ts` - Test setup and mocks
- `src/test/mocks/` - Mock Web3 providers and APIs

**Test Coverage Targets**:
- Components: `TokenBalances`, `ConnectButton`, `Navbar`
- Hooks: Custom hooks for Web3 interactions
- Utils: Token balance calculations, formatting
- Integration: Wallet connection flows

### Code Quality Tools

#### ESLint Enhancement
**Current**: Basic Next.js ESLint config
**Recommendation**: Add comprehensive linting rules

```json
// .eslintrc.json additions
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

#### Pre-commit Hooks
```bash
yarn add -D husky lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

#### Type Safety Improvements
**Issues Found**:
- `any` types in `TokenBalances` component
- Missing type definitions for token data
- Untyped props in several components

**Solution**: Create comprehensive type definitions
```typescript
// src/types/token.ts
export interface TokenBalance {
  id: number;
  contractAddress: string;
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
  logo?: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
}
```

## Architecture Improvements

### State Management Enhancement

**Current Issues**:
- Token balances stored in component state only
- No global state for user preferences
- No caching of blockchain data

**Recommendations**:

1. **Add Zustand for Client State**:
```bash
yarn add zustand
```

```typescript
// src/stores/useTokenStore.ts
import { create } from 'zustand';

interface TokenStore {
  tokens: TokenBalance[];
  loading: boolean;
  error: string | null;
  setTokens: (tokens: TokenBalance[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
```

2. **Implement React Query Caching**:
```typescript
// src/hooks/useTokenBalances.ts
import { useQuery } from '@tanstack/react-query';

export const useTokenBalances = (address?: string) => {
  return useQuery({
    queryKey: ['tokenBalances', address],
    queryFn: () => fetchTokenBalances(address),
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};
```

### Custom Hooks Development

**Missing Custom Hooks**:
```typescript
// src/hooks/useWallet.ts
export const useWallet = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  return {
    address,
    isConnected,
    connect,
    disconnect,
    connectors,
  };
};

// src/hooks/useTokenActions.ts  
export const useTokenActions = () => {
  const transferToken = useCallback(async (tokenAddress: string, to: string, amount: string) => {
    // Implementation
  }, []);
  
  return { transferToken };
};
```

### Component Architecture

#### Component Splitting
**Current**: Large components with multiple responsibilities
**Recommendation**: Split into smaller, focused components

```typescript
// Break down TokenBalances component
components/tokens/
├── TokenBalanceTable.tsx    // Table display
├── TokenBalanceRow.tsx      // Individual row
├── TokenBalanceHeader.tsx   // Table header
├── TokenBalanceLoader.tsx   // Loading state
└── TokenBalanceEmpty.tsx    // Empty state
```

#### Prop Interface Definitions
```typescript
// src/components/tokens/types.ts
export interface TokenBalanceTableProps {
  tokens: TokenBalance[];
  loading: boolean;
  error?: string;
  onRefresh?: () => void;
}
```

## Web3 Integration Improvements

### Error Handling Enhancement

**Current Issues**:
- Basic try/catch with minimal error information
- No user-friendly error messages
- No retry mechanisms

**Recommendations**:

1. **Web3 Error Handler Utility**:
```typescript
// src/utils/web3ErrorHandler.ts
export const handleWeb3Error = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('User denied')) {
      return 'Transaction was cancelled by user';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    // Add more specific error handling
  }
  return 'An unexpected error occurred';
};
```

2. **Retry Logic for Network Calls**:
```typescript
// src/utils/retryWrapper.ts
export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};
```

### Network Support

**Current Limitation**: Hard-coded to Ethereum mainnet for token balances
**Recommendation**: Dynamic network detection

```typescript
// src/utils/networkUtils.ts
export const getAlchemyNetworkForChain = (chainId: number): Network => {
  switch (chainId) {
    case 534352: // Scroll Mainnet
      // Note: May need custom configuration for Scroll
      return Network.ETH_MAINNET; // Placeholder
    case 534351: // Scroll Sepolia
      return Network.ETH_SEPOLIA;
    default:
      return Network.ETH_MAINNET;
  }
};
```

### Performance Optimizations

#### Token Balance Caching
```typescript
// src/utils/tokenCache.ts
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class TokenBalanceCache {
  private cache = new Map<string, { data: TokenBalance[]; timestamp: number }>();
  
  get(address: string): TokenBalance[] | null {
    const cached = this.cache.get(address);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }
  
  set(address: string, data: TokenBalance[]): void {
    this.cache.set(address, { data, timestamp: Date.now() });
  }
}
```

## User Experience Enhancements

### Loading States

**Current**: Basic spinner
**Recommendations**:

1. **Skeleton Loading**:
```bash
yarn add react-loading-skeleton
```

2. **Progressive Loading States**:
```typescript
// Different loading states for better UX
enum LoadingState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  FETCHING_BALANCE = 'fetching_balance',
  FETCHING_METADATA = 'fetching_metadata',
  COMPLETE = 'complete'
}
```

### Accessibility Improvements

**Issues**:
- Missing ARIA labels on interactive elements
- No keyboard navigation support
- Poor screen reader support

**Solutions**:
```typescript
// Add proper ARIA attributes
<button
  aria-label="Connect wallet to view token balances"
  onClick={connectWallet}
>
  Connect Wallet
</button>

// Add loading announcements
<div aria-live="polite" className="sr-only">
  {loading && "Loading token balances..."}
</div>
```

### Responsive Design

**Current**: Basic responsive layout
**Recommendation**: Enhanced mobile experience

```typescript
// src/hooks/useBreakpoint.ts
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('lg');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      if (window.innerWidth < 640) setBreakpoint('sm');
      else if (window.innerWidth < 1024) setBreakpoint('md');
      else setBreakpoint('lg');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
};
```

## Security Enhancements

### Environment Variable Validation

```typescript
// src/config/env.ts
const requiredEnvVars = {
  NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
  NEXT_PUBLIC_ALCHEMY_KEY: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
} as const;

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const env = requiredEnvVars;
```

### Input Sanitization

```typescript
// src/utils/validation.ts
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const sanitizeTokenAmount = (amount: string): string => {
  // Remove non-numeric characters except decimal point
  return amount.replace(/[^0-9.]/g, '').replace(/\.{2,}/g, '.');
};
```

## Documentation Improvements

### Component Documentation

**Add JSDoc to all components**:
```typescript
/**
 * TokenBalances component displays a table of token balances for the connected wallet
 * 
 * @component
 * @example
 * ```tsx
 * <TokenBalances />
 * ```
 */
export const TokenBalances: React.FC = () => {
  // Component implementation
};
```

### API Documentation

**Create**: `docs/api.md` documenting:
- Alchemy SDK integration patterns
- Wagmi hook usage
- Error handling strategies

### Development Guidelines

**Create**: `docs/CONTRIBUTING.md` with:
- Code style guidelines
- Component development patterns
- Testing requirements
- Pull request template

## Performance Monitoring

### Bundle Analysis

```bash
yarn add -D @next/bundle-analyzer
```

```javascript
// next.config.mjs addition
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

### Web Vitals Tracking

```typescript
// src/utils/webVitals.ts
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    console.log(metric);
  }
}
```

## Deployment & DevOps

### Environment Configuration

**Create**: `.env.example` with all required variables
```bash
# Reown AppKit Configuration
NEXT_PUBLIC_PROJECT_ID=your_project_id_here

# Alchemy Configuration  
NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_key_here

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id_here
```

### CI/CD Pipeline

**GitHub Actions workflow**:
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: yarn type-check  
      - run: yarn test
      - run: yarn build
```

## Implementation Priority

### Phase 1 (Critical - Week 1)
- [ ] Fix environment variable issue
- [ ] Add proper error boundaries
- [ ] Fix network configuration mismatch
- [ ] Add basic type definitions

### Phase 2 (High Priority - Week 2-3)  
- [ ] Implement testing framework
- [ ] Add comprehensive error handling
- [ ] Create custom hooks
- [ ] Enhance ESLint configuration

### Phase 3 (Medium Priority - Week 4-6)
- [ ] Add state management with Zustand
- [ ] Implement caching layer
- [ ] Enhance accessibility
- [ ] Add component documentation

### Phase 4 (Nice to Have - Ongoing)
- [ ] Performance monitoring
- [ ] Bundle optimization
- [ ] Advanced Web3 features
- [ ] Comprehensive analytics

## Success Metrics

- **Code Quality**: ESLint errors < 5, TypeScript strict mode enabled
- **Test Coverage**: > 80% component coverage
- **Performance**: First Contentful Paint < 2s, Largest Contentful Paint < 4s
- **Accessibility**: WCAG 2.1 AA compliance
- **User Experience**: Error rate < 2%, successful wallet connections > 95%

---

*This improvement plan should be implemented incrementally, with regular reviews and adjustments based on user feedback and technical discoveries.*