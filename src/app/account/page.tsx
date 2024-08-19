"use client";

import TokenBalances from "@/components/tokens";
import { shortenAddress } from "@/helpers";
import { Button } from "@nextui-org/button";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { useAccount, useBalance } from "wagmi";

export default function AccountPage() {
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
  });

  return (
    <section className="flex flex-row w-full gap-x-16">
      <div className="self-start flex flex-col items-center gap-y-4 max-w-md mx-auto">
        {/* <div className="text-center text-balance">
          Details about your account
        </div> */}

        <Card className="flex flex-col flex-1 grow shrink-0 p-4 w-full">
          <header className="font-bold text-xl text-center text-gray-500">
            Account Info
          </header>
          <CardBody>
            <CardHeader className="block font-bold text-5xl text-center self-center">
              {shortenAddress(address)}
            </CardHeader>
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
      </div>

      <div className="flex-1 h-dvh overflow-y-auto">
        <TokenBalances />
      </div>
    </section>
  );
}
