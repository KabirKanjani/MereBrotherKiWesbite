import config from "@payload-config";
import { RootLayout } from "@payloadcms/next/layouts";
import { handleServerFunctions } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import React from "react";

import { importMap } from "./admin/importMap";

/*
 * Payload's compiled stylesheet. This is imported as plain CSS rather than
 * through custom.scss on purpose: routing it through sass made the whole admin
 * panel fail to compile, and the symptom was subtle. Without it the page renders
 * completely unstyled — Times New Roman, no theme colours, none of Payload's
 * CSS variables defined — even though the route returns 200.
 *
 * custom.css is imported after it so the Kivia palette overrides the defaults.
 */
import "@payloadcms/next/css";
import "./custom.css";

type Args = {
  children: React.ReactNode;
};

/**
 * The admin panel's root layout.
 *
 * RootLayout renders its own <html> and <body>, so this file deliberately does
 * not. It sits in a route group, which keeps the admin off the storefront's
 * routing and out of its design entirely.
 */
export const metadata = {
  title: "Kivia Designs Admin",
  description: "Manage products, photographs and page wording.",
  // Keep the admin out of search results.
  robots: { index: false, follow: false },
};

/**
 * The admin UI calls back into the server for privileged work such as slug
 * generation and duplicate checks. handleServerFunctions needs the config and
 * import map bound in, and the admin only ever passes a name and arguments, so
 * this wrapper is the client-shaped function RootLayout expects.
 */
const serverFunction: ServerFunctionClient = async (clientArgs) => {
  "use server";
  return handleServerFunctions({ config, importMap, ...clientArgs });
};

export default function Layout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}