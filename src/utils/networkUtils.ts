import { Network } from "alchemy-sdk";

export const getAlchemyNetworkForChain = (chainId: number): Network => {
  switch (chainId) {
    case 534352: // Scroll Mainnet
      return Network.ETH_MAINNET; // Placeholder - Scroll mainnet may need custom config
    case 534351: // Scroll Sepolia
      return Network.ETH_SEPOLIA;
    default:
      return Network.ETH_MAINNET;
  }
};
