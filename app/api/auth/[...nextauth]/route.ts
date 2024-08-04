import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
 
export const { handlers:{GET, POST} } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
})
