'use client';

import React, { useState } from 'react';
import { Transaction, TransactionBatch, TransactionTemplate, TransactionStatus, TransactionType } from '../../types/token';
import { transactionBatcher } from '../../utils/transactionBatchUtils';
import { useAccount } from 'wagmi';

export const TransactionBatcher: React.FC = () => {
  const { address } = useAccount();
  const [batches, setBatches] = useState<TransactionBatch[]>([]);
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showScheduleBatch, setShowScheduleBatch] = useState(false);
  const [selectedBatchForScheduling, setSelectedBatchForScheduling] = useState<string | null>(null);

  // Refresh data
  const refreshData = () => {
    setBatches(transactionBatcher.getAllBatches());
    setTemplates(transactionBatcher.getAllTemplates());
  };

  React.useEffect(() => {
    refreshData();
  }, []);

  const handleExecuteBatch = async (batchId: string) => {
    try {
      const success = await transactionBatcher.executeBatch(batchId);
      if (success) {
        refreshData();
        alert('Batch executed successfully!');
      } else {
        alert('Batch execution failed. Check individual transaction statuses.');
      }
    } catch (error) {
      console.error('Failed to execute batch:', error);
      alert('Failed to execute batch');
    }
  };

  const handleCreateBatch = (transactions: Transaction[], description?: string, scheduledFor?: number) => {
    const batchId = transactionBatcher.createBatch(transactions, description, scheduledFor);
    refreshData();
    setShowCreateBatch(false);
    alert(`Batch created with ID: ${batchId}${scheduledFor ? ' and scheduled for execution' : ''}`);
  };

  const handleCreateTemplate = (template: Omit<TransactionTemplate, 'id' | 'createdAt' | 'usageCount'>) => {
    const templateId = transactionBatcher.createTemplate(template);
    refreshData();
    setShowCreateTemplate(false);
    alert(`Template created with ID: ${templateId}`);
  };

  const handleUseTemplate = (templateId: string) => {
    const transaction = transactionBatcher.useTemplate(templateId);
    if (transaction) {
      // Add to a new batch or execute immediately
      handleCreateBatch([transaction], `From template: ${templates.find(t => t.id === templateId)?.name}`);
    }
  };

  const handleScheduleBatch = (batchId: string, executeAt: number) => {
    // Update the batch with scheduling info
    const batch = batches.find(b => b.id === batchId);
    if (batch) {
      batch.scheduledFor = executeAt;
      batch.status = 'scheduled';
      setBatches([...batches]);
    }
    setShowScheduleBatch(false);
    setSelectedBatchForScheduling(null);
  };

  const handleCancelScheduledBatch = (batchId: string) => {
    if (transactionBatcher.cancelScheduledBatch(batchId)) {
      refreshData();
      alert('Scheduled batch cancelled successfully');
    }
  };

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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Transaction Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateBatch(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Batch
          </button>
          <button
            onClick={() => setShowCreateTemplate(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create Template
          </button>
        </div>
      </div>

      {/* Batches Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Transaction Batches</h3>
        {batches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No batches created yet
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => (
              <div key={batch.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{batch.description || `Batch ${batch.id.slice(-8)}`}</div>
                    <div className="text-sm text-gray-500">
                      Created {new Date(batch.createdAt).toLocaleString()}
                      {batch.scheduledFor && ` • Scheduled ${new Date(batch.scheduledFor).toLocaleString()}`}
                      {batch.executedAt && ` • Executed ${new Date(batch.executedAt).toLocaleString()}`}
                    </div>
                    {batch.networks && batch.networks.length > 1 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Multi-chain: {batch.networks.map(id => getNetworkName(id)).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      batch.status === 'completed' ? 'text-green-600 bg-green-100' :
                      batch.status === 'failed' ? 'text-red-600 bg-red-100' :
                      batch.status === 'executing' ? 'text-yellow-600 bg-yellow-100' :
                      batch.status === 'scheduled' ? 'text-blue-600 bg-blue-100' :
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {batch.status}
                    </span>
                    {batch.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleExecuteBatch(batch.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Execute
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBatchForScheduling(batch.id);
                            setShowScheduleBatch(true);
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Schedule
                        </button>
                      </>
                    )}
                    {batch.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancelScheduledBatch(batch.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {batch.transactions.length} transaction{batch.transactions.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Templates Section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Transaction Templates</h3>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No templates created yet
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-500">
                      {template.description} • Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}
                      {template.lastUsed && ` • Last used ${new Date(template.lastUsed).toLocaleString()}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Batch Modal */}
      {showCreateBatch && (
        <CreateBatchModal
          onClose={() => setShowCreateBatch(false)}
          onCreate={handleCreateBatch}
        />
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <CreateTemplateModal
          onClose={() => setShowCreateTemplate(false)}
          onCreate={handleCreateTemplate}
        />
      )}

      {/* Schedule Batch Modal */}
      {showScheduleBatch && selectedBatchForScheduling && (
        <ScheduleBatchModal
          batchId={selectedBatchForScheduling}
          onClose={() => {
            setShowScheduleBatch(false);
            setSelectedBatchForScheduling(null);
          }}
          onSchedule={handleScheduleBatch}
        />
      )}
    </div>
  );
};

// Schedule Batch Modal Component
const ScheduleBatchModal: React.FC<{
  batchId: string;
  onClose: () => void;
  onSchedule: (batchId: string, executeAt: number) => void;
}> = ({ batchId, onClose, onSchedule }) => {
  const [executeAt, setExecuteAt] = useState('');

  const handleSubmit = () => {
    const executeTime = new Date(executeAt).getTime();
    if (isNaN(executeTime) || executeTime <= Date.now()) {
      alert('Please select a valid future date and time');
      return;
    }
    onSchedule(batchId, executeTime);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Schedule Batch Execution</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Execution Date & Time</label>
            <input
              type="datetime-local"
              value={executeAt}
              onChange={(e) => setExecuteAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} // At least 1 minute from now
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Schedule Batch
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Batch Modal Component
const CreateBatchModal: React.FC<{
  onClose: () => void;
  onCreate: (transactions: Transaction[], description?: string, scheduledFor?: number) => void;
}> = ({ onClose, onCreate }) => {
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scheduledFor, setScheduledFor] = useState('');
  const [enableScheduling, setEnableScheduling] = useState(false);

  const addTransaction = () => {
    const newTx: Transaction = {
      hash: '',
      from: '',
      to: '',
      value: '0',
      timestamp: Date.now(),
      status: TransactionStatus.PENDING,
      type: TransactionType.TRANSFER,
      networkId: 1,
      networkName: 'Ethereum',
      category: 'other',
    };
    setTransactions([...transactions, newTx]);
  };

  const updateTransaction = (index: number, field: keyof Transaction, value: any) => {
    const updated = [...transactions];
    updated[index] = { ...updated[index], [field]: value };
    setTransactions(updated);
  };

  const handleSubmit = () => {
    if (transactions.length === 0) {
      alert('Please add at least one transaction');
      return;
    }

    let scheduledTime: number | undefined;
    if (enableScheduling && scheduledFor) {
      scheduledTime = new Date(scheduledFor).getTime();
      if (isNaN(scheduledTime) || scheduledTime <= Date.now()) {
        alert('Please select a valid future date and time for scheduling');
        return;
      }
    }

    onCreate(transactions, description || undefined, scheduledTime);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create Transaction Batch</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Batch description"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={enableScheduling}
              onChange={(e) => setEnableScheduling(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium">Schedule batch execution</span>
          </label>
          {enableScheduling && (
            <div className="mt-2">
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Transactions</span>
            <button
              onClick={addTransaction}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add Transaction
            </button>
          </div>

          {transactions.map((tx, index) => (
            <div key={index} className="border border-gray-200 rounded p-3 mb-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="To address"
                  value={tx.to}
                  onChange={(e) => updateTransaction(index, 'to', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Value (wei)"
                  value={tx.value}
                  onChange={(e) => updateTransaction(index, 'value', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Batch
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Template Modal Component
const CreateTemplateModal: React.FC<{
  onClose: () => void;
  onCreate: (template: Omit<TransactionTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
}> = ({ onClose, onCreate }) => {
  const [template, setTemplate] = useState({
    name: '',
    description: '',
    type: TransactionType.TRANSFER,
    networkId: 1,
    to: '',
    value: '',
    data: '',
    gasLimit: '',
  });

  const handleSubmit = () => {
    if (!template.name || !template.to) {
      alert('Please fill in name and recipient address');
      return;
    }
    onCreate(template);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Create Transaction Template</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Template name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={template.description}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Template description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Recipient Address</label>
            <input
              type="text"
              value={template.to}
              onChange={(e) => setTemplate({ ...template, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Value (wei)</label>
            <input
              type="text"
              value={template.value}
              onChange={(e) => setTemplate({ ...template, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
};
