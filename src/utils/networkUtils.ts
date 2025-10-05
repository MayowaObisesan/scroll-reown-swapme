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
