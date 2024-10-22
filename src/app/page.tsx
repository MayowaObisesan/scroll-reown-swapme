"use client";

import Image from "next/image";

import { Button } from "@nextui-org/button";
import TokenBalances from "@/components/tokens";
import ConnectButton from "@/components/connectButton";
import { title } from "@/components/primitives";
import { Chip } from "@nextui-org/chip";
import { useAccount } from "wagmi";

function HomeOld() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <section className="hidden">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
          <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            Get started by editing&nbsp;
            <code className="font-mono font-bold">src/app/page.tsx</code>
          </p>
          <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
            <a
              className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
              href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              By{" "}
              <Image
                src="/vercel.svg"
                alt="Vercel Logo"
                className="dark:invert"
                width={100}
                height={24}
                priority
              />
            </a>
          </div>
        </div>

        <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]">
          <Image
            className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
            src="/next.svg"
            alt="Next.js Logo"
            width={180}
            height={37}
            priority
          />
        </div>

        <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Docs{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Find in-depth information about Next.js features and API.
            </p>
          </a>

          <a
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Learn{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Learn about Next.js in an interactive course with&nbsp;quizzes!
            </p>
          </a>

          <a
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Templates{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Explore starter templates for Next.js.
            </p>
          </a>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              Deploy{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-balance text-sm opacity-50">
              Instantly deploy your Next.js site to a shareable URL with Vercel.
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <section className="container flex flex-col items-center justify-center max-w-7xl mx-auto gap-4 py-8 md:py-4">
      <div className="inline-block max-w-xl text-center justify-center leading-[3]">
        {/* <div className={"font-bold text-4xl text-pretty"}>SwapMe Protocol</div> */}
        <Chip color="default" variant="flat" size="lg">
          Powered by Reown AppKit
        </Chip>
        <br />
        <div className={title({ color: "blue", size: "xxxl" })}>
          Buy, Send, Swap
        </div>
        <div className={title({ size: "lg", fullWidth: true })}>
          all in one Platform
        </div>
        <br />
        {address && isConnected && (
          <Chip color="primary" variant="shadow" size="lg">
            Click the button below to begin
          </Chip>
        )}
        {/* <h1 className={title({ size: "sm" })}>(Tokenbound Accounts)</h1> */}
        {/* <h2 className={subtitle({ class: "mt-4" })}>
          Using Tokenbound ERC6551 accounts on starknet
        </h2> */}
      </div>

      <div className="flex gap-3 max-w-md">
        {/* <NextLink
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href={"/swap"}
        >
          Swap
        </NextLink> */}
        {/* <Button
          color="primary"
          variant="shadow"
          size="lg"
          radius="full"
          className="w-60"
        >
          Swap
        </Button> */}
        <ConnectButton />
      </div>

      {/* <div className="mt-8">
        <span>
          Learn more about tokenbound accounts{" "}
          <NextLink
            href="https://tokenbound.gitbook.io/starknet-tokenbound"
            target="_blank"
          >
            here
          </NextLink>
        </span>
        <Snippet hideCopyButton hideSymbol variant="bordered"></Snippet>
      </div> */}

      <div className="mt-20 w-full lg:max-w-5xl">
        <div className="font-bold text-3xl text-center pb-12">Your Tokens</div>
        <TokenBalances />
      </div>
    </section>
  );
}
