import { NetworkSpecificConfig } from '../networkSpecificUtils';

const ethereumConfig: NetworkSpecificConfig = {
  rpcs: [
    'https://eth-mainnet.alchemyapi.io/v2/',
    'https://mainnet.infura.io/v3/.',
    'https://cloudflare-eth.com'
  ],
  features: [
    'full-defi-ecosystem',
    'nft-marketplaces',
    'layer2-bridging',
    'advanced-analytics'
  ],
  protocols: [
    'uniswap-v3',
    'aave',
    'compound',
    'curve',
    '1inch-aggregator'
  ]
};

export default ethereumConfig;
