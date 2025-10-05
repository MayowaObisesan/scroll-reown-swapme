import { TransactionBatch, Transaction, TransactionTemplate, TransactionStatus, TransactionType } from '../types/token';
import { sendTransaction, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiAdapter } from '../config/wagmi';
import { Hash } from 'viem';

export class TransactionBatcher {
  private batches: Map<string, TransactionBatch> = new Map();
  private templates: Map<string, TransactionTemplate> = new Map();

  // Batch Management
  createBatch(transactions: Transaction[], description?: string): string {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const batch: TransactionBatch = {
      id: batchId,
      transactions,
      status: 'pending' as const,
      createdAt: Date.now(),
      description,
    };

    this.batches.set(batchId, batch);
    return batchId;
  }

  async executeBatch(batchId: string): Promise<boolean> {
    const batch = this.batches.get(batchId);
    if (!batch || batch.status !== 'pending') {
      throw new Error('Batch not found or not in pending state');
    }

    batch.status = 'executing' as const;

    try {
      // Execute transactions sequentially for now
      // In a more advanced implementation, we could batch them using multicall
      for (const transaction of batch.transactions) {
        try {
          const hash = await sendTransaction(wagmiAdapter.wagmiConfig, {
            to: transaction.to as `0x${string}`,
            value: transaction.value ? BigInt(transaction.value) : undefined,
            gas: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
            chainId: transaction.networkId,
          });

          transaction.hash = hash;
          transaction.status = TransactionStatus.PENDING;

          // Wait for confirmation
          const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
            hash,
            chainId: transaction.networkId,
          });

          transaction.status = receipt.status === 'success' ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED;
          transaction.blockNumber = Number(receipt.blockNumber);
          transaction.gasUsed = receipt.gasUsed.toString();

        } catch (error) {
          console.error(`Failed to execute transaction in batch ${batchId}:`, error);
          transaction.status = TransactionStatus.FAILED;
          batch.status = 'failed' as const;
          return false;
        }
      }

      batch.status = 'completed' as const;
      batch.executedAt = Date.now();
      return true;

    } catch (error) {
      console.error(`Failed to execute batch ${batchId}:`, error);
      batch.status = 'failed' as const;
      return false;
    }
  }

  getBatch(batchId: string): TransactionBatch | undefined {
    return this.batches.get(batchId);
  }

  getAllBatches(): TransactionBatch[] {
    return Array.from(this.batches.values());
  }

  // Template Management
  createTemplate(template: Omit<TransactionTemplate, 'id' | 'createdAt' | 'usageCount'>): string {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullTemplate: TransactionTemplate = {
      ...template,
      id: templateId,
      createdAt: Date.now(),
      usageCount: 0,
    };

    this.templates.set(templateId, fullTemplate);
    return templateId;
  }

  useTemplate(templateId: string): Transaction | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    template.lastUsed = Date.now();
    template.usageCount++;

    return {
      hash: '', // Will be set when executed
      from: '', // Will be set by wallet
      to: template.to,
      value: template.value || '0',
      timestamp: Date.now(),
      status: TransactionStatus.PENDING,
      type: template.type,
      networkId: template.networkId,
      networkName: getNetworkName(template.networkId),
      category: 'other',
    };
  }

  getTemplate(templateId: string): TransactionTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): TransactionTemplate[] {
    return Array.from(this.templates.values()).sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
  }

  deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  // Scheduled Transactions (basic implementation)
  scheduleTransaction(
    transaction: Transaction,
    executeAt: number,
    gasPriceThreshold?: string
  ): string {
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, this would use a job scheduler or cron
    const timeoutId = setTimeout(async () => {
      try {
        // Check gas price if threshold is set
        if (gasPriceThreshold) {
          // Implementation would check current gas price
          // For now, we'll skip this check
        }

        const hash = await sendTransaction(wagmiAdapter.wagmiConfig, {
          to: transaction.to as `0x${string}`,
          value: transaction.value ? BigInt(transaction.value) : undefined,
          gas: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
          chainId: transaction.networkId,
        });

        transaction.hash = hash;
        transaction.status = TransactionStatus.PENDING;

      } catch (error) {
        console.error(`Failed to execute scheduled transaction ${scheduleId}:`, error);
        transaction.status = TransactionStatus.FAILED;
      }
    }, Math.max(0, executeAt - Date.now()));

    // Store the timeout ID for cancellation
    (transaction as any)._scheduleTimeout = timeoutId;

    return scheduleId;
  }

  cancelScheduledTransaction(transaction: Transaction): boolean {
    const timeoutId = (transaction as any)._scheduleTimeout;
    if (timeoutId) {
      clearTimeout(timeoutId);
      return true;
    }
    return false;
  }
}

const getNetworkName = (networkId: number): string => {
  const names: { [key: number]: string } = {
    1: 'Ethereum',
    5: 'Goerli',
    11155111: 'Sepolia',
    8453: 'Base',
    84532: 'Base Sepolia',
    534352: 'Scroll',
    534351: 'Scroll Sepolia',
  };
  return names[networkId] || 'Unknown';
};

// Singleton instance
export const transactionBatcher = new TransactionBatcher();
