import type { NextAuthConfig } from "next-auth";
import { get } from "@vercel/edge-config";
import { JWTAdapter } from "./lib/adapters";

const protectedPath: string[] = [
  "/",
  "/settings"
];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  adapter: JWTAdapter,
  session: {
    strategy:'jwt'
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const list: { name: string; email: string }[] | undefined = await get(
          "allowList"
        );
        console.log("allow:", list);
        if (list) {
          console.log("try signin:", profile);
          return list.some((v) => v.email === profile?.email);
        }
        return false;
      }
      return true;
    },
    authorized({ auth, request: { nextUrl } }) {
      console.log("authorize");
      const isLoggedIn = !!auth?.user;
      const isProtectedPath = protectedPath.some(v => v === nextUrl.pathname);
      if (isProtectedPath) {
        if (isLoggedIn) return true;
        return Response.redirect(new URL("/login", nextUrl)); // Redirect unauthenticated users to login page
      } else {
        return true;
      }
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
