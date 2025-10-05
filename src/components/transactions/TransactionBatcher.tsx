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

  const handleCreateBatch = (transactions: Transaction[], description?: string) => {
    const batchId = transactionBatcher.createBatch(transactions, description);
    refreshData();
    setShowCreateBatch(false);
    alert(`Batch created with ID: ${batchId}`);
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
                      {batch.executedAt && ` • Executed ${new Date(batch.executedAt).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      batch.status === 'completed' ? 'text-green-600 bg-green-100' :
                      batch.status === 'failed' ? 'text-red-600 bg-red-100' :
                      batch.status === 'executing' ? 'text-yellow-600 bg-yellow-100' :
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {batch.status}
                    </span>
                    {batch.status === 'pending' && (
                      <button
                        onClick={() => handleExecuteBatch(batch.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Execute
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
    </div>
  );
};

// Create Batch Modal Component
const CreateBatchModal: React.FC<{
  onClose: () => void;
  onCreate: (transactions: Transaction[], description?: string) => void;
}> = ({ onClose, onCreate }) => {
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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
    onCreate(transactions, description || undefined);
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
