# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SwapMe is a Web3 wallet management application built on Next.js that provides comprehensive wallet information and token management capabilities for the Scroll blockchain ecosystem. The application allows users to connect their wallets, view token balances, and manage their digital assets through a clean, modern interface.

## Development Commands

### Core Development
```bash
# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Lint code
yarn lint
```

### Package Management
```bash
# Install dependencies
yarn install

# Add new dependency
yarn add <package-name>

# Add dev dependency
yarn add -D <package-name>
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: NextUI (React components)
- **Styling**: Tailwind CSS
- **Blockchain Integration**: Wagmi + Reown AppKit (formerly Web3Modal)
- **State Management**: React Query (@tanstack/react-query)
- **Network Provider**: Alchemy SDK
- **Type System**: TypeScript

### Key Architecture Patterns

#### Provider Architecture
The app uses a multi-layer provider structure:
1. `AppKitProvider` - Wraps Wagmi and React Query for blockchain connectivity
2. `Providers` - NextUI and theme providers
3. All providers are initialized in `layout.tsx`

#### Blockchain Integration
- **Wagmi Config**: Located in `src/config/wagmi.ts`
- **Supported Networks**: Scroll and Scroll Sepolia
- **Wallet Connection**: Reown AppKit with custom theming
- **Token Data**: Fetched via Alchemy SDK

#### Component Structure
- **App Router**: Uses Next.js 13+ app directory structure
- **Components**: Organized by feature in `src/components/`
- **Shared Logic**: Custom hooks in `src/hooks/`
- **Configuration**: Centralized in `src/config/`

### Critical Files

#### Configuration Files
- `src/config/wagmi.ts` - Blockchain configuration and network setup
- `src/config/site.ts` - Site metadata and navigation structure
- `src/context/index.tsx` - Main AppKit provider setup

#### Core Components
- `src/app/layout.tsx` - Root layout with all providers
- `src/app/page.tsx` - Homepage with wallet connection and token display
- `src/components/tokens/index.tsx` - Token balance table with Alchemy integration
- `src/components/connectButton/index.tsx` - Web3Modal wallet connection

### Environment Variables Required
```bash
NEXT_PUBLIC_PROJECT_ID=    # Reown Cloud project ID
NEXT_PUBLIC_ALCHEMY_KEY=   # Alchemy API key for token data
```

### Blockchain Networks
The application is configured for:
- **Scroll Mainnet** - Primary network
- **Scroll Sepolia** - Testnet for development

### Token Balance Integration
Token balances are fetched using Alchemy SDK with the following flow:
1. User connects wallet via Reown AppKit
2. `TokenBalances` component fetches balances from Alchemy
3. Only non-zero balances are displayed
4. Token metadata (name, symbol, decimals) is enriched via Alchemy

### Styling Approach
- **Tailwind CSS** for utility classes
- **NextUI** components for consistent design system
- **Dark mode** support via next-themes
- **Custom theming** applied to Reown AppKit modal

### State Management
- **Wagmi hooks** for blockchain state (useAccount, etc.)
- **React Query** for async data fetching and caching
- **React state** for component-level state management

## Development Notes

### Wallet Integration
- Uses Reown AppKit (latest version of Web3Modal)
- Supports both connection and swap functionality
- Custom theming with `--w3m-accent: #006FEE`

### Network Configuration
- Configured specifically for Scroll ecosystem
- Mainnet and testnet support
- Can be extended to support additional networks in `wagmi.ts`

### Component Organization
- Feature-based component organization
- Shared primitives in `components/primitives.ts`
- Custom hooks for reusable logic

### Build Configuration
- Webpack externals configured for Web3 libraries
- NextUI theme integration in Tailwind config
- TypeScript path aliases (`@/*` → `./src/*`)