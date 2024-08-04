import type { NextAuthConfig } from "next-auth";
import { get } from "@vercel/edge-config";
import { JWTAdapter } from "./lib/adapters";

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
      console.log("atorize");
      const isLoggedIn = !!auth?.user;
      const isOnMain = nextUrl.pathname.startsWith("/");
      if (isOnMain) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
