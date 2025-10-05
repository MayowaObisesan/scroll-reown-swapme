'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Alchemy } from 'alchemy-sdk';
import { getAlchemyNetworkForChain } from '../../utils/networkUtils';
import { TokenBalance, TokenStandard } from '../../types/token';
import { networks } from '../../config/wagmi';

interface NFTWithMetadata extends TokenBalance {
  image?: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  collection?: {
    name: string;
    floorPrice?: number;
  };
}

export const NFTPortfolio: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFTWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState<number | 'all'>('all');
  const [selectedNft, setSelectedNft] = useState<NFTWithMetadata | null>(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address || !isConnected) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allNfts: NFTWithMetadata[] = [];

        const networksToFetch = selectedNetwork === 'all'
          ? networks
          : networks.filter(n => n.id === selectedNetwork);

        for (const network of networksToFetch) {
          try {
            const config = {
              apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY,
              network: getAlchemyNetworkForChain(network.id),
            };
            const alchemy = new Alchemy(config);

            const nftsResponse = await alchemy.nft.getNftsForOwner(address, {
              contractAddresses: [],
              pageSize: 100,
            });

            const enrichedNfts = await Promise.all(
              nftsResponse.ownedNfts.map(async (nft) => {
                let image = '';
                let description = '';
                let attributes: Array<{ trait_type: string; value: string }> = [];

                // Get NFT metadata
                try {
                  const metadata = await alchemy.nft.getNftMetadata(
                    nft.contract.address,
                    nft.tokenId
                  );

                  image = metadata.media?.[0]?.thumbnail ||
                         metadata.media?.[0]?.gateway ||
                         metadata.rawMetadata?.image ||
                         '';

                  description = metadata.description || '';
                  attributes = metadata.rawMetadata?.attributes || [];
                } catch (error) {
                  console.warn(`Failed to fetch metadata for ${nft.contract.address}:${nft.tokenId}`);
                }

                // Get floor price if available
                let floorPrice;
                try {
                  const floorPriceData = await alchemy.nft.getFloorPrice(nft.contract.address);
                  floorPrice = floorPriceData.openSea?.floorPrice;
                } catch (error) {
                  // Floor price not available
                }

                return {
                  id: 0,
                  contractAddress: nft.contract.address,
                  name: nft.name || nft.contract.name || 'Unknown NFT',
                  symbol: nft.contract.symbol || 'NFT',
                  balance: nft.contract.tokenType === 'ERC1155' ? parseInt(nft.balance?.toString() || '1') : 1,
                  decimals: 0,
                  logo: image,
                  networkId: network.id,
                  networkName: network.name,
                  usdValue: 0, // NFT floor prices would need separate API
                  standard: nft.contract.tokenType === 'ERC1155' ? TokenStandard.ERC1155 : TokenStandard.ERC721,
                  tokenId: nft.tokenId,
                  image,
                  description,
                  attributes,
                  collection: {
                    name: nft.contract.name || 'Unknown Collection',
                    floorPrice,
                  },
                } as NFTWithMetadata;
              })
            );

            allNfts.push(...enrichedNfts);
          } catch (networkError) {
            console.warn(`Failed to fetch NFTs for ${network.name}:`, networkError);
          }
        }

        setNfts(allNfts);
      } catch (error) {
        console.error('Failed to fetch NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [address, isConnected, selectedNetwork]);

  const handleTransfer = (nft: NFTWithMetadata) => {
    // TODO: Implement NFT transfer functionality
    alert(`Transfer functionality for ${nft.name} coming soon!`);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please connect your wallet to view your NFT portfolio</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">NFT Portfolio</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Networks</option>
            {networks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your NFTs...</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No NFTs found in your wallet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {nfts.map((nft, index) => (
            <div
              key={`${nft.contractAddress}-${nft.tokenId}-${index}`}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedNft(nft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedNft(nft);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${nft.name}`}
            >
              <div className="aspect-square bg-gray-100 relative">
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-nft.png'; // Fallback image
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span>No Image</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {nft.networkName}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm truncate">{nft.name}</h3>
                <p className="text-xs text-gray-500 truncate">{nft.collection?.name}</p>
                {nft.collection?.floorPrice && (
                  <p className="text-xs text-green-600 mt-1">
                    Floor: {nft.collection.floorPrice} ETH
                  </p>
                )}
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    #{nft.tokenId}
                  </span>
                  {nft.balance > 1 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      x{nft.balance}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NFT Detail Modal */}
      {selectedNft && (
        <NFTDetailModal
          nft={selectedNft}
          onClose={() => setSelectedNft(null)}
          onTransfer={handleTransfer}
        />
      )}
    </div>
  );
};

// NFT Detail Modal Component
const NFTDetailModal: React.FC<{
  nft: NFTWithMetadata;
  onClose: () => void;
  onTransfer: (nft: NFTWithMetadata) => void;
}> = ({ nft, onClose, onTransfer }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold">{nft.name}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image Available
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Collection:</strong> {nft.collection?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Token ID:</strong> {nft.tokenId}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Network:</strong> {nft.networkName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Standard:</strong> {nft.standard}
                </p>
                {nft.balance > 1 && (
                  <p className="text-sm text-gray-600">
                    <strong>Balance:</strong> {nft.balance}
                  </p>
                )}
                {nft.collection?.floorPrice && (
                  <p className="text-sm text-green-600">
                    <strong>Floor Price:</strong> {nft.collection.floorPrice} ETH
                  </p>
                )}
              </div>
            </div>

            <div>
              {nft.description && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-gray-700">{nft.description}</p>
                </div>
              )}

              {nft.attributes && nft.attributes.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Attributes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {nft.attributes.map((attr, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                        <div className="font-medium text-gray-600">{attr.trait_type}</div>
                        <div className="text-gray-800">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => onTransfer(nft)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
                >
                  Transfer NFT
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement listing functionality
                    alert('Listing functionality coming soon!');
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm"
                >
                  List for Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTPortfolio;
