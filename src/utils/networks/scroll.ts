import { NetworkSpecificConfig } from '../networkSpecificUtils';

const scrollConfig: NetworkSpecificConfig = {
  rpcs: [
    'https://scroll-mainnet.alchemyapi.io/v2/',
    'https://rpc.scroll.io',
    'https://scroll.publicnode.com'
  ],
  features: [
    'zk-evm-optimizations',
    'fast-finality',
    'scroll-ecosystem-dapps',
    'gaming-metaverse'
  ],
  protocols: [
    'scroll-native-dex',
    'zk-optimized-protocols',
    'gaming-dapps',
    'metaverse-platforms'
  ]
};

export default scrollConfig;
