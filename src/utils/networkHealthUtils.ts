import { Alchemy, Network } from "alchemy-sdk";
import { getAlchemyNetworkForChain } from "./networkUtils";

export interface NetworkHealth {
  networkId: number;
  networkName: string;
  gasPrice?: string;
  congestion?: 'low' | 'medium' | 'high';
  lastBlock?: number;
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

    // Get gas price
    const gasPrice = await alchemy.core.getGasPrice();
    health.gasPrice = gasPrice.toString();

    // Get latest block to check network activity
    const latestBlock = await alchemy.core.getBlockNumber();
    health.lastBlock = Number(latestBlock);

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
