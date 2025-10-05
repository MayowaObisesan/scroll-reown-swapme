import { Alchemy, Network } from "alchemy-sdk";
import { getAlchemyNetworkForChain } from "./networkUtils";

export interface NetworkHealth {
  networkId: number;
  networkName: string;
  gasPrice?: string;
  congestion?: 'low' | 'medium' | 'high';
  lastBlock?: number;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'offline';
  responseTime?: number; // in milliseconds
  error?: string;
}

const healthCache: { [key: number]: { data: NetworkHealth; timestamp: number } } = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds

export const getNetworkHealth = async (
  networkId: number,
  networkName: string,
  alchemyApiKey?: string
): Promise<NetworkHealth> => {
  // Check cache
  if (healthCache[networkId] && Date.now() - healthCache[networkId].timestamp < CACHE_DURATION) {
    return healthCache[networkId].data;
  }

  const health: NetworkHealth = {
    networkId,
    networkName,
  };

  try {
    if (!alchemyApiKey) {
      throw new Error('Alchemy API key not provided');
    }

    const config = {
      apiKey: alchemyApiKey,
      network: getAlchemyNetworkForChain(networkId),
    };

    const alchemy = new Alchemy(config);
    const startTime = Date.now();

    // Get gas price
    const gasPrice = await alchemy.core.getGasPrice();
    health.gasPrice = gasPrice.toString();

    // Get latest block to check network activity
    const latestBlock = await alchemy.core.getBlockNumber();
    health.lastBlock = Number(latestBlock);

    const endTime = Date.now();
    health.responseTime = endTime - startTime;

    // Determine connection quality based on response time
    if (health.responseTime < 500) {
      health.connectionQuality = 'excellent';
    } else if (health.responseTime < 2000) {
      health.connectionQuality = 'good';
    } else if (health.responseTime < 5000) {
      health.connectionQuality = 'poor';
    } else {
      health.connectionQuality = 'offline';
    }

    // Simple congestion estimation based on gas price
    const gasPriceGwei = parseInt(gasPrice.toString()) / 1e9;
    if (gasPriceGwei < 20) {
      health.congestion = 'low';
    } else if (gasPriceGwei < 100) {
      health.congestion = 'medium';
    } else {
      health.congestion = 'high';
    }

  } catch (error) {
    health.error = (error as Error).message;
    health.connectionQuality = 'offline';
    console.warn(`Failed to get health for ${networkName}:`, error);
  }

  // Cache the result
  healthCache[networkId] = {
    data: health,
    timestamp: Date.now(),
  };

  return health;
};

export const getMultipleNetworkHealth = async (
  networks: Array<{ id: number; name: string }>,
  alchemyApiKey?: string
): Promise<NetworkHealth[]> => {
  const promises = networks.map(network =>
    getNetworkHealth(network.id, network.name, alchemyApiKey)
  );

  return Promise.all(promises);
};

export const isNetworkOutage = (health: NetworkHealth): boolean => {
  return !!health.error || !health.lastBlock || health.lastBlock === 0;
};

export const getDegradedNetworkData = (networkId: number): NetworkHealth | null => {
  // Return cached data if available, even if stale
  const cached = healthCache[networkId];
  if (cached) {
    return { ...cached.data, error: 'Network temporarily unavailable - showing cached data' };
  }
  return null;
};

export const handleNetworkOutage = async (
  networkId: number,
  networkName: string,
  operation: () => Promise<any>
): Promise<{ success: boolean; data?: any; degraded?: boolean; error?: string }> => {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    const degradedData = getDegradedNetworkData(networkId);
    if (degradedData) {
      return {
        success: false,
        degraded: true,
        data: degradedData,
        error: `Network outage on ${networkName} - using cached data`
      };
    }
    return {
      success: false,
      error: `Network outage on ${networkName} - operation failed`
    };
  }
};
