import { NetworkSpecificConfig } from '../networkSpecificUtils';

const baseConfig: NetworkSpecificConfig = {
  rpcs: [
    'https://base-mainnet.g.alchemy.com/v2/',
    'https://mainnet.base.org',
    'https://base.publicnode.com'
  ],
  features: [
    'coinbase-pay-integration',
    'usdc-native-support',
    'low-fee-transactions',
    'base-ecosystem-dapps'
  ],
  protocols: [
    'coinbase-wallet',
    'aerodrome',
    'base-swap',
    'usdc-defi-products'
  ]
};

export default baseConfig;
