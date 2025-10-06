import { NetworkSpecificConfig } from '../networkSpecificUtils';

const defaultConfig: NetworkSpecificConfig = {
  rpcs: [
    'https://cloudflare-eth.com'
  ],
  features: [
    'basic-erc20-support',
    'standard-transactions'
  ],
  protocols: [
    'erc20-tokens'
  ]
};

export default defaultConfig;
