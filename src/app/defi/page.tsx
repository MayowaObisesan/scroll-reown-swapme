"use client";

import { DeFiPositions } from "@/components/defi";

export default function DeFiPage() {
  return (
    <section className="container flex flex-col items-center justify-center max-w-7xl mx-auto gap-4 py-8 md:py-4">
      <div className="font-extrabold text-5xl text-center text-balance leading-normal py-16">
        Your DeFi Positions
      </div>
      <div className="w-full max-w-4xl">
        <DeFiPositions />
      </div>
    </section>
  );
}
