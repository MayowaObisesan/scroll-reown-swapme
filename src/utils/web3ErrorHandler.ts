export const handleWeb3Error = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('User denied')) {
      return 'Transaction was cancelled by user';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    if (error.message.includes('network')) {
      return 'Network error occurred. Please check your connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    // Add more specific error handling
  }
  return 'An unexpected error occurred';
};
