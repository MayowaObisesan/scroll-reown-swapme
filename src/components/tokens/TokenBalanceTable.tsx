import React, { useState, Suspense, lazy } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  getKeyValue,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { TokenBalance, TokenStandard } from "../../types/token";
import { Spinner } from "@heroui/spinner";

// Lazy load TokenAnalytics for better performance
const TokenAnalytics = lazy(() => import("./TokenAnalytics").then(module => ({ default: module.TokenAnalytics })));

const columns = [
  {
    key: "id",
    label: "ID",
  },
  {
    key: "name",
    label: "NAME",
  },
  {
    key: "balance",
    label: "BALANCE",
  },
  {
    key: "symbol",
    label: "SYMBOL",
  },
  {
    key: "standard",
    label: "STANDARD",
  },
  {
    key: "usdValue",
    label: "VALUE (USD)",
  },
  {
    key: "networkName",
    label: "NETWORK",
  },
  {
    key: "analytics",
    label: "ANALYTICS",
  },
];

interface TokenBalanceTableProps {
  tokens: TokenBalance[];
  loading: boolean;
  error?: string;
  onRefresh?: () => void;
}

export const TokenBalanceTable: React.FC<TokenBalanceTableProps> = ({
  tokens,
  loading,
  error,
  onRefresh,
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);

  const handleAnalyticsClick = (token: TokenBalance) => {
    setSelectedToken(token);
    onOpen();
  };

  return (
    <>
      <Table aria-label="Token balances table">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={tokens}
          isLoading={loading}
          loadingContent={<Spinner label="Loading..." />}
          emptyContent={
            error
              ? `Error: ${error}`
              : "No tokens to display."
          }
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>
                  {columnKey === "usdValue"
                    ? item.usdValue
                      ? `$${item.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                      : "-"
                    : columnKey === "standard"
                    ? item.standard.toUpperCase()
                    : columnKey === "analytics"
                    ? (
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleAnalyticsClick(item)}
                      >
                        View
                      </Button>
                    )
                    : getKeyValue(item, columnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Token Analytics
              </ModalHeader>
              <ModalBody>
                <Suspense fallback={<Spinner label="Loading analytics..." />}>
                  {selectedToken && <TokenAnalytics token={selectedToken} />}
                </Suspense>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
