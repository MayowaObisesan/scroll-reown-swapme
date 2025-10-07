'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface SecuritySettings {
  multiSigEnabled: boolean;
  multiSigThreshold: number;
  multiSigSigners: string[];
  hardwareWalletConnected: boolean;
  hardwareWalletType: string;
  phishingDetectionEnabled: boolean;
  socialRecoveryEnabled: boolean;
  socialRecoveryGuardians: string[];
}

interface RiskAssessment {
  overall: 'low' | 'medium' | 'high';
  factors: {
    networkRisk: number;
    contractRisk: number;
    amountRisk: number;
    frequencyRisk: number;
  };
  recommendations: string[];
}

export const SecurityDashboard: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [settings, setSettings] = useState<SecuritySettings>({
    multiSigEnabled: false,
    multiSigThreshold: 2,
    multiSigSigners: [],
    hardwareWalletConnected: false,
    hardwareWalletType: '',
    phishingDetectionEnabled: true,
    socialRecoveryEnabled: false,
    socialRecoveryGuardians: [],
  });

  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>({
    overall: 'low',
    factors: {
      networkRisk: 0,
      contractRisk: 0,
      amountRisk: 0,
      frequencyRisk: 0,
    },
    recommendations: [],
  });

  const [phishingAlerts, setPhishingAlerts] = useState<string[]>([]);

  useEffect(() => {
    // Load security settings from localStorage or API
    const savedSettings = localStorage.getItem('securitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check for hardware wallet connection
    checkHardwareWallet();

    // Initialize phishing detection
    initializePhishingDetection();
  }, []);

  const checkHardwareWallet = async () => {
    // Check for hardware wallet connection (Ledger, Trezor, etc.)
    // This is a simplified implementation
    try {
      // In a real implementation, you'd check for WebUSB or similar APIs
      const devices = await (navigator as any).usb.getDevices();
      const hardwareWallets = devices.filter((device: any) =>
        device.productName?.includes('Ledger') ||
        device.productName?.includes('Trezor')
      );

      if (hardwareWallets.length > 0) {
        setSettings(prev => ({
          ...prev,
          hardwareWalletConnected: true,
          hardwareWalletType: hardwareWallets[0].productName || 'Unknown',
        }));
      }
    } catch (error) {
      console.warn('Hardware wallet detection failed:', error);
    }
  };

  const initializePhishingDetection = () => {
    // Initialize phishing detection for different networks
    // This would integrate with services like OpenSea or custom phishing databases
    const alerts: string[] = [];

    // Example phishing alerts (in real implementation, this would be dynamic)
    if (settings.phishingDetectionEnabled) {
      alerts.push('Warning: Suspicious contract interaction detected on Ethereum');
      alerts.push('Info: Verified DEX aggregator detected');
    }

    setPhishingAlerts(alerts);
  };

  const updateSettings = (newSettings: Partial<SecuritySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('securitySettings', JSON.stringify(updated));
  };

  const addMultiSigSigner = (signer: string) => {
    if (!settings.multiSigSigners.includes(signer)) {
      updateSettings({
        multiSigSigners: [...settings.multiSigSigners, signer],
      });
    }
  };

  const removeMultiSigSigner = (signer: string) => {
    updateSettings({
      multiSigSigners: settings.multiSigSigners.filter(s => s !== signer),
    });
  };

  const addGuardian = (guardian: string) => {
    if (!settings.socialRecoveryGuardians.includes(guardian)) {
      updateSettings({
        socialRecoveryGuardians: [...settings.socialRecoveryGuardians, guardian],
      });
    }
  };

  const removeGuardian = (guardian: string) => {
    updateSettings({
      socialRecoveryGuardians: settings.socialRecoveryGuardians.filter(g => g !== guardian),
    });
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please connect your wallet to access security settings</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Security Dashboard</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          riskAssessment.overall === 'high' ? 'bg-red-100 text-red-800' :
          riskAssessment.overall === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          Risk Level: {riskAssessment.overall.toUpperCase()}
        </div>
      </div>

      {/* Phishing Detection Alerts */}
      {phishingAlerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Security Alerts</h3>
          <ul className="space-y-1">
            {phishingAlerts.map((alert, index) => (
              <li key={index} className="text-sm text-yellow-700">• {alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Multi-Signature Setup */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Multi-Signature Wallet</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.multiSigEnabled}
              onChange={(e) => updateSettings({ multiSigEnabled: e.target.checked })}
              className="mr-2"
            />
            Enable Multi-Sig
          </label>
        </div>

        {settings.multiSigEnabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Required Signatures</label>
              <input
                type="number"
                min="1"
                max={settings.multiSigSigners.length + 1}
                value={settings.multiSigThreshold}
                onChange={(e) => updateSettings({ multiSigThreshold: parseInt(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-md w-20"
              />
              <span className="ml-2 text-sm text-gray-500">
                of {settings.multiSigSigners.length + 1} total signers
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Additional Signers</label>
              <div className="space-y-2">
                {settings.multiSigSigners.map((signer, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded flex-1">
                      {signer}
                    </span>
                    <button
                      onClick={() => removeMultiSigSigner(signer)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add signer address (0x...)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        if (input.value) {
                          addMultiSigSigner(input.value);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input.value) {
                        addMultiSigSigner(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hardware Wallet Status */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Hardware Wallet</h3>
        <div className="flex items-center space-x-4">
          <div className={`w-4 h-4 rounded-full ${
            settings.hardwareWalletConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm">
            {settings.hardwareWalletConnected
              ? `Connected: ${settings.hardwareWalletType}`
              : 'No hardware wallet detected'
            }
          </span>
          {!settings.hardwareWalletConnected && (
            <button
              onClick={checkHardwareWallet}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Check Again
            </button>
          )}
        </div>
      </div>

      {/* Social Recovery */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Social Recovery</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.socialRecoveryEnabled}
              onChange={(e) => updateSettings({ socialRecoveryEnabled: e.target.checked })}
              className="mr-2"
            />
            Enable Social Recovery
          </label>
        </div>

        {settings.socialRecoveryEnabled && (
          <div>
            <label className="block text-sm font-medium mb-2">Recovery Guardians</label>
            <div className="space-y-2">
              {settings.socialRecoveryGuardians.map((guardian, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded flex-1">
                    {guardian}
                  </span>
                  <button
                    onClick={() => removeGuardian(guardian)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add guardian address (0x...)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (input.value) {
                        addGuardian(input.value);
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value) {
                      addGuardian(input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Phishing Detection Settings */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Phishing Detection</h3>
            <p className="text-sm text-gray-600">Automatically detect and warn about suspicious transactions</p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.phishingDetectionEnabled}
              onChange={(e) => {
                updateSettings({ phishingDetectionEnabled: e.target.checked });
                if (e.target.checked) {
                  initializePhishingDetection();
                } else {
                  setPhishingAlerts([]);
                }
              }}
              className="mr-2"
            />
            Enabled
          </label>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{riskAssessment.factors.networkRisk}%</div>
            <div className="text-sm text-gray-600">Network Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{riskAssessment.factors.contractRisk}%</div>
            <div className="text-sm text-gray-600">Contract Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{riskAssessment.factors.amountRisk}%</div>
            <div className="text-sm text-gray-600">Amount Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{riskAssessment.factors.frequencyRisk}%</div>
            <div className="text-sm text-gray-600">Frequency Risk</div>
          </div>
        </div>

        {riskAssessment.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {riskAssessment.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-700">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;
