"use client";

import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { fontSans } from "@/config/fonts";
import { cookieToInitialState } from "wagmi";
import { config } from "@/config/wagmi";
// import { headers } from "next/headers";
import AppKitProvider from "@/context";
import { siteConfig } from "@/config/site";
import clsx from "clsx";
import { Providers } from "./provider";
import NextTopLoader from "nextjs-toploader";
import { Navbar } from "@/components/navbar";
// import Footer from "@/components/footer";

// export const metadata: Metadata = {
//   title: {
//     default: siteConfig.name,
//     template: `%s - ${siteConfig.name}`,
//   },
//   description: siteConfig.description,
//   icons: {
//     icon: "/favicon.ico",
//   },
// };

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const initialState = cookieToInitialState(config, headers().get("cookie"));

  return (
    <html suppressHydrationWarning lang="en">
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AppKitProvider>
          <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
            <NextTopLoader />
            <div className="relative flex flex-col h-screen">
              <Navbar />
              <main className="pt-16 px-6 flex-grow">{children}</main>
              <footer className="w-full flex items-center justify-center py-3">
                {/* <Footer /> */}
              </footer>
            </div>
          </Providers>
        </AppKitProvider>
      </body>
    </html>
  );
}
