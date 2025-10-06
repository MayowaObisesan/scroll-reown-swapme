// Network-specific utilities with dynamic imports for code splitting

export interface NetworkSpecificConfig {
  rpcs: string[];
  features: string[];
  protocols: string[];
}

// Dynamic import for network-specific configurations
export const getNetworkSpecificConfig = async (chainId: number): Promise<NetworkSpecificConfig> => {
  switch (chainId) {
    case 1: // Ethereum
      return (await import('./networks/ethereum')).default;
    case 8453: // Base
      return (await import('./networks/base')).default;
    case 534352: // Scroll
      return (await import('./networks/scroll')).default;
    default:
      return (await import('./networks/default')).default;
  }
};

// Lazy load network-specific components
export const loadNetworkComponent = async (chainId: number, componentName: string) => {
  const networkName = getNetworkName(chainId);
  try {
    const module = await import(`../components/networks/${networkName}/${componentName}`);
    return module.default;
  } catch {
    // Fallback to default component
    const module = await import(`../components/networks/default/${componentName}`);
    return module.default;
  }
};

const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1: return 'ethereum';
    case 8453: return 'base';
    case 534352: return 'scroll';
    default: return 'default';
  }
};
