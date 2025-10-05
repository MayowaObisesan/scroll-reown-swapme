import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  getKeyValue,
} from "@nextui-org/table";
import { TokenBalance } from "../../types/token";
import {Spinner} from "@nextui-org/spinner";

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
    key: "usdValue",
    label: "VALUE (USD)",
  },
  {
    key: "networkName",
    label: "NETWORK",
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
  return (
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
                  : getKeyValue(item, columnKey)}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
