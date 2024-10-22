"use client";

import React, { ReactNode } from "react";
import { projectId, metadata, wagmiAdapter, networks } from "@/config/wagmi";

import { createWeb3Modal } from "@web3modal/wagmi/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { State, WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";

// Setup queryClient
const queryClient = new QueryClient();

if (!projectId) throw new Error("Project ID is not defined");

// // Create modal
// createWeb3Modal({
//   metadata,
//   wagmiConfig: config,
//   projectId,
//   enableAnalytics: true, // Optional - defaults to your Cloud configuration
//   enableSwaps: true, // true is the default, set to false to prevent swap
// });

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  // @ts-ignore
  networks: networks,
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    swaps: true,
  },
  themeVariables: {
    "--w3m-accent": "#006FEE",
  },
});

export default function AppKitProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
