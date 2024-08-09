import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { get } from '@vercel/edge-config';
import { NextRequest, NextResponse } from 'next/server';

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|models|.*\\.ico$|.*\\.png$).*)'],
};

export default async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Handle /configs path separately
    if (pathname === '/configs') {
        try {
            // Fetch client configuration from edge-config
            const clientConfig = await get('clientConfig');
            
            // Return the client configuration as JSON
            return NextResponse.json(clientConfig);
        } catch (error) {
            console.error('Error fetching client configuration:', error);
            return NextResponse.json({ error: 'Unable to fetch client configuration' }, { status: 500 });
        }
    }

    // For all other routes, use the existing auth middleware
    return (NextAuth(authConfig).auth as any)(req);
}