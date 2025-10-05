export const handleWeb3Error = (error: unknown, chainId?: number): string => {
  if (error instanceof Error) {
    const networkName = getNetworkName(chainId);

    if (error.message.includes('User denied')) {
      return 'Transaction was cancelled by user';
    }
    if (error.message.includes('insufficient funds')) {
      return `Insufficient funds for transaction on ${networkName}`;
    }
    if (error.message.includes('network')) {
      return `Network error occurred on ${networkName}. Please check your connection.`;
    }
    if (error.message.includes('timeout')) {
      return `Request timed out on ${networkName}. Please try again.`;
    }
    if (error.message.includes('gas')) {
      return `Gas estimation failed on ${networkName}. Please check gas settings.`;
    }
    if (error.message.includes('nonce')) {
      return `Nonce error on ${networkName}. Please refresh and try again.`;
    }
    if (error.message.includes('revert')) {
      return `Transaction reverted on ${networkName}. Check contract logic or parameters.`;
    }
    // Network-specific errors
    if (chainId === 1 || chainId === 11155111) { // Ethereum
      if (error.message.includes('underpriced')) {
        return 'Transaction underpriced on Ethereum. Increase gas price.';
      }
    }
    if (chainId === 8453 || chainId === 84532) { // Base
      if (error.message.includes('base')) {
        return 'Base network specific error. Please check Base documentation.';
      }
    }
    if (chainId === 534352 || chainId === 534351) { // Scroll
      if (error.message.includes('scroll')) {
        return 'Scroll network specific error. Please check Scroll documentation.';
      }
    }
  }
  return 'An unexpected error occurred';
};

const getNetworkName = (chainId?: number): string => {
  switch (chainId) {
    case 1: return 'Ethereum Mainnet';
    case 5: return 'Goerli';
    case 11155111: return 'Sepolia';
    case 8453: return 'Base Mainnet';
    case 84532: return 'Base Sepolia';
    case 534352: return 'Scroll Mainnet';
    case 534351: return 'Scroll Sepolia';
    default: return 'the selected network';
  }
};
