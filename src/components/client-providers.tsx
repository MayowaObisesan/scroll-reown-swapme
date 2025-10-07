"use client";

import React from "react";
import AppKitProvider from "@/context";
import { Providers } from "@/app/provider";
import NextTopLoader from "nextjs-toploader";
import { Navbar } from "@/components/navbar";

export function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("ClientProviders rendering");

  return (
    <AppKitProvider>
      <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
        <NextTopLoader />
        <div className="relative flex flex-col h-screen">
          {/* <Navbar /> */}
          <main className="px-6 grow">{children}</main>
          <footer className="w-full flex items-center justify-center py-3">
            {/* <Footer /> */}
          </footer>
        </div>
      </Providers>
    </AppKitProvider>
  );
}
