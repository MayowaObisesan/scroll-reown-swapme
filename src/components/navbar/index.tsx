"use client";

import React from "react";
import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
} from "@nextui-org/navbar";
import { link as linkStyles } from "@nextui-org/theme";
import NextLink from "next/link";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import ConnectButton from "../connectButton";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <NextUINavbar maxWidth="full" onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <p className="font-bold text-inherit">Wallet-Info</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-x-8" justify="center">
        {siteConfig.navItems.map((item, index) => (
          <NavbarItem key={`${item}-${index}`}>
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active=true]:font-medium"
              )}
              color="foreground"
              href={item.href}
            >
              {item.label}
            </NextLink>
          </NavbarItem>
        ))}
      </NavbarContent>
      <NavbarContent justify="end">
        {/* <NavbarItem className="hidden lg:flex">
          <Link href="#">Login</Link>
        </NavbarItem> */}
        <NavbarItem className="flex flex-row items-center gap-x-4">
          <ThemeSwitch />
          <ConnectButton />
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu>
        {siteConfig.navItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <NextLink
              className={clsx(
                linkStyles({ color: "foreground" }),
                "data-[active=true]:text-primary data-[active=true]:font-medium"
              )}
              color="foreground"
              href={item.href}
            >
              {item.label}
            </NextLink>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </NextUINavbar>

    // <NextUINavbar maxWidth="xl" position="sticky">
    //   <NavbarBrand as="li" className="gap-3 max-w-fit">
    //     <NextLink className="flex justify-start items-center gap-1" href="/">
    //       <Logo />
    //       <p className="font-bold text-inherit">ACME</p>
    //     </NextLink>
    //   </NavbarBrand>
    //   <NavbarContent className="basis-1/5 sm:basis-full" justify="center">
    //     <ul className="hidden lg:flex gap-4 justify-start ml-2">
    //       {siteConfig.navItems.map((item) => (
    //         <NavbarItem key={item.href}>
    //           <NextLink
    //             className={clsx(
    //               linkStyles({ color: "foreground" }),
    //               "data-[active=true]:text-primary data-[active=true]:font-medium",
    //             )}
    //             color="foreground"
    //             href={item.href}
    //           >
    //             {item.label}
    //           </NextLink>
    //         </NavbarItem>
    //       ))}
    //     </ul>
    //   </NavbarContent>

    //   <NavbarContent
    //     className="hidden sm:flex basis-1/5 sm:basis-full"
    //     justify="end"
    //   >
    //     <NavbarItem className="hidden sm:flex gap-2">
    //       <Link isExternal aria-label="Twitter" href={siteConfig.links.twitter}>
    //         <TwitterIcon className="text-default-500" />
    //       </Link>
    //       <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
    //         <DiscordIcon className="text-default-500" />
    //       </Link>
    //       <Link isExternal aria-label="Github" href={siteConfig.links.github}>
    //         <GithubIcon className="text-default-500" />
    //       </Link>
    //       <ThemeSwitch />
    //     </NavbarItem>
    //     <NavbarItem className="hidden md:flex">
    //       <Button
    //         isExternal
    //         as={Link}
    //         className="text-sm font-normal text-default-600 bg-default-100"
    //         href={siteConfig.links.discord}
    //         startContent={<HeartFilledIcon className="text-danger" />}
    //         variant="flat"
    //       >
    //         Sponsor
    //       </Button>
    //     </NavbarItem>
    //   </NavbarContent>

    //   <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
    //     <Link isExternal aria-label="Github" href={siteConfig.links.github}>
    //       <GithubIcon className="text-default-500" />
    //     </Link>
    //     <ThemeSwitch />
    //     <NavbarMenuToggle />
    //   </NavbarContent>
    // </NextUINavbar>
  );
};
