"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { TokenStandard, CustomToken } from "../../types/token";
import { validateCustomToken } from "../../utils/advancedTokenUtils";

interface CustomTokenImportProps {
  onTokenAdded: (token: CustomToken) => void;
  networkId: number;
}

const TOKEN_STANDARDS = [
  { key: TokenStandard.ERC20, label: "ERC-20" },
  { key: TokenStandard.ERC721, label: "ERC-721 (NFT)" },
  { key: TokenStandard.ERC1155, label: "ERC-1155 (Multi-Token)" },
];

export const CustomTokenImport: React.FC<CustomTokenImportProps> = ({
  onTokenAdded,
  networkId,
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [contractAddress, setContractAddress] = useState("");
  const [standard, setStandard] = useState<TokenStandard>(TokenStandard.ERC20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!contractAddress.trim()) {
      setError("Contract address is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const metadata = await validateCustomToken(contractAddress.trim(), networkId, standard);

      if (metadata) {
        const customToken: CustomToken = {
          contractAddress: contractAddress.trim(),
          networkId,
          standard,
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          logo: metadata.logo,
        };

        onTokenAdded(customToken);
        setContractAddress("");
        setStandard(TokenStandard.ERC20);
        onOpenChange(); // Close modal
      } else {
        setError("Invalid token contract or network mismatch");
      }
    } catch (err) {
      setError("Failed to validate token. Please check the contract address and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onPress={onOpen} color="primary" variant="flat">
        Import Custom Token
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Import Custom Token
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Contract Address"
                    placeholder="0x..."
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    errorMessage={error}
                    isInvalid={!!error}
                  />

                  <Select
                    label="Token Standard"
                    placeholder="Select token standard"
                    selectedKeys={[standard]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as TokenStandard;
                      setStandard(selected);
                    }}
                  >
                    {TOKEN_STANDARDS.map((std) => (
                      <SelectItem key={std.key}>
                        {std.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <p className="text-sm text-gray-600">
                    Make sure the contract address is correct and exists on the selected network.
                    Importing invalid tokens may cause errors.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleImport}
                  isLoading={loading}
                  disabled={!contractAddress.trim()}
                >
                  {loading ? "Validating..." : "Import Token"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
