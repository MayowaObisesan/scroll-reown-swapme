import { Network } from "alchemy-sdk";

export const getAlchemyNetworkForChain = (chainId: number): Network => {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return Network.ETH_MAINNET;
    case 5: // Goerli
      return Network.ETH_GOERLI;
    case 11155111: // Sepolia
      return Network.ETH_SEPOLIA;
    case 8453: // Base Mainnet
      return Network.BASE_MAINNET;
    case 84532: // Base Sepolia
      return Network.BASE_SEPOLIA;
    case 534352: // Scroll Mainnet
      return Network.SCROLL_MAINNET;
    case 534351: // Scroll Sepolia
      return Network.SCROLL_SEPOLIA;
    default:
      return Network.ETH_MAINNET;
  }
};

export interface NetworkConfig {
  rpcs: string[];
  name: string;
}

export const getNetworkConfig = (chainId: number): NetworkConfig => {
  const configs: Record<number, NetworkConfig> = {
    // Ethereum
    1: {
      rpcs: [
        'https://eth-mainnet.alchemyapi.io/v2/...',
        'https://mainnet.infura.io/v3/...',
        'https://cloudflare-eth.com'
      ],
      name: 'Ethereum'
    },
    11155111: {
      rpcs: [
        'https://eth-sepolia.alchemyapi.io/v2/...',
        'https://sepolia.infura.io/v3/...',
        'https://rpc.sepolia.org'
      ],
      name: 'Sepolia'
    },
    // Base
    8453: {
      rpcs: [
        'https://base-mainnet.g.alchemy.com/v2/...',
        'https://mainnet.base.org',
        'https://base.publicnode.com'
      ],
      name: 'Base'
    },
    84532: {
      rpcs: [
        'https://base-sepolia.g.alchemy.com/v2/...',
        'https://sepolia.base.org',
        'https://base-sepolia.publicnode.com'
      ],
      name: 'Base Sepolia'
    },
    // Scroll
    534352: {
      rpcs: [
        'https://scroll-mainnet.alchemyapi.io/v2/...',
        'https://rpc.scroll.io',
        'https://scroll.publicnode.com'
      ],
      name: 'Scroll'
    },
    534351: {
      rpcs: [
        'https://scroll-sepolia.alchemyapi.io/v2/...',
        'https://sepolia-rpc.scroll.io',
        'https://scroll-sepolia.publicnode.com'
      ],
      name: 'Scroll Sepolia'
    }
  };
  return configs[chainId] || configs[1]; // Default to Ethereum
};

export const getFallbackRpc = (chainId: number, currentRpc: string): string | null => {
  const config = getNetworkConfig(chainId);
  const currentIndex = config.rpcs.indexOf(currentRpc);
  if (currentIndex === -1 || currentIndex === config.rpcs.length - 1) {
    return null; // No fallback available
  }
  return config.rpcs[currentIndex + 1];
};

export const getPrimaryRpc = (chainId: number): string => {
  return getNetworkConfig(chainId).rpcs[0];
};
