
import { withLogging } from "@/lib/logger";
import { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import prisma from "@/lib/prisma"

const JWTAdapter: Adapter = {
    // JWT Adapter only create record for new user, and whenever the user has same address then it does nothing
    
    
    createUser: withLogging(async (user: AdapterUser) => {
        // Assuming AdapterUser matches the Prisma User model closely
        const createdUser = await prisma?.user.create({
            data: {
                email: user.email,
                name: user.name,
                image: user.image,
            },
        });
        return createdUser;
    }, 'createUser'),

    getUser: withLogging(async (id: string) => {
        const user = await prisma?.user.findUnique({
            where: {
                id,
            },
        });
        return user;
    }, 'getUser'),

    getUserByEmail: withLogging(async (email: string) => {
        const user = await prisma?.user.findUnique({
            where: {
                email,
            },
        });
        return user;
    }, 'getUserByEmail'),

    getUserByAccount: withLogging(async ({ providerAccountId, provider }: AdapterAccount) => {
        const account = await prisma?.account.findFirst({
            where: {
                providerAccountId,
                provider,
            },
            include: {
                user: true, // Include the user linked to this account
            },
        });
        return account?.user ?? null;
    }, 'getUserByAccount'),
    linkAccount: withLogging(async (account: AdapterAccount) => {
        const linkedAccount = await prisma?.account.create({
            data: {
                userId: account.userId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
            },
        });
        return linkedAccount;
    }, 'linkAccount'),

    unlinkAccount: withLogging(async ({ providerAccountId, provider }: AdapterAccount) => {
        await prisma?.account.deleteMany({
            where: {
                providerAccountId,
                provider,
            },
        });
    }, 'unlinkAccount'),
}

export { JWTAdapter };
