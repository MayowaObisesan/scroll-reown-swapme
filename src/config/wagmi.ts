import { createAppKit } from '@reown/appkit/react'

import { arbitrum, mainnet, scrollSepolia, base, baseSepolia, sepolia } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from 'viem'

// 0. Setup queryClient
export const queryClient = new QueryClient()

// 1. Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) throw new Error('Project ID is not defined')

// 2. Create a metadata object - optional
export const metadata = {
    name: 'WalletInfo',
    description: 'Wallet-info streamlines your wallet management process, saving users valuable time and effort while ensuring that they stay updated on the status of their wallets',
    url: 'https://web3modal.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Custom network with custom RPC
const customScroll = defineChain({
  id: 534352,
  name: 'Scroll',
  network: 'scroll',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.scroll.io'],
    },
    public: {
      http: ['https://rpc.scroll.io'],
    },
  },
  blockExplorers: {
    default: { name: 'Scrollscan', url: 'https://scrollscan.com' },
  },
  testnet: false,
});

// 3. Set the networks
export const networks = [scrollSepolia, baseSepolia, base, mainnet, sepolia]

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: true
})

// Create wagmiConfig
// const chains = [mainnet, base] as const
// export const config = defaultWagmiConfig({
//     chains,
//     projectId,
//     metadata,
//     auth: {
//         email: true, // default to true
//         socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook', 'farcaster'],
//         showWallets: true, // default to true
//         walletFeatures: true // default to true
//     },
//     ssr: true,
//     storage: createStorage({
//         storage: cookieStorage
//     }),
// })
