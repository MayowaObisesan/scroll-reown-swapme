"use client";

import TokenBalances from "@/components/tokens";
import ErrorBoundary from "@/components/ErrorBoundary";
import { shortenAddress } from "@/helpers";
import { Button } from "@nextui-org/button";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { Address } from "viem";
import { useAccount, useBalance } from "wagmi";
import { Skeleton } from "@nextui-org/skeleton";
import { SearchIcon } from "@/components/icons";

export default function AccountPage() {
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
  });

  if (!address) {
    return (
      <div className="flex flex-col justify-center w-full h-full">
        <Card className="fixed top-32 left-0 right-0 z-10 max-w-md mx-auto">
          <CardBody className="p-4 bg-warning text-warning-foreground text-center">
            <p>Connect your Wallet to see your tokens</p>
          </CardBody>
        </Card>

        <Card className="bg-transparent shadow-none w-full">
          <CardBody className="flex items-center justify-center h-[200px]">
            <div className="text-4xl text-gray-600 text-center leading-loose">
              No Wallet Connected
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <section>
      {!address && (
        <Card className="sticky top-20 z-10 max-w-md mx-auto">
          <CardBody className="p-4 bg-warning text-warning-foreground text-center">
            <p>Connect your Wallet to see your tokens</p>
          </CardBody>
        </Card>
      )}
      <div className="font-extrabold text-5xl text-center text-balance leading-normal py-16">
        Details about your account
      </div>
      <section className="flex flex-row w-full gap-x-16">
        <div className="flex flex-col items-center gap-y-4 w-96 mx-auto">
          <Skeleton isLoaded={!!address} className="rounded-xl w-full">
            <Card className="flex flex-col flex-1 grow shrink-0 p-4 w-full">
              {/* <header className="font-bold text-xl text-center text-gray-500">
            Account Info
          </header> */}
              <CardHeader className="block font-bold text-5xl text-center self-center">
                {shortenAddress(address as Address)}
              </CardHeader>
              <CardBody>
                <Divider className="my-4" />
                <section className="flex flex-col gap-y-4 my-8">
                  <div className="font-bold text-xl">Account details</div>
                  {/* <div className="flex flex-row items-center justify-center">
                <span className="grow shrink-0">Locked: </span>
                <span className="shrink grow-0">No</span>
              </div> */}
                  <div className="flex flex-row items-center justify-center">
                    <span className="grow shrink-0">Balance: </span>
                    <div className="shrink grow-0 text-right">
                      {Number(balance?.formatted) ?? 0} {balance?.symbol}{" "}
                      <div className="text-xs font-bold text-gray-500">
                        ({balance?.decimals} decimals)
                      </div>
                    </div>
                  </div>
                </section>

                {/* <Button
              type="button"
              color="danger"
              isLoading={loading}
              disabled={!!loading}
              onClick={handleLock}
              className="font-medium"
            >
              Lock Account
            </Button> */}
              </CardBody>
            </Card>
          </Skeleton>
        </div>

        <div className="flex-1 h-dvh overflow-y-auto p-4">
          <ErrorBoundary>
            <TokenBalances />
          </ErrorBoundary>
        </div>
      </section>
    </section>
  );
}
