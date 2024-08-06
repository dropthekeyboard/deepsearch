'use server';
 
import { auth, signIn, signOut } from '@/auth';
import cuid2 from '@paralleldrive/cuid2';
import { SharedContent } from '@prisma/client';
import { kv } from '@vercel/kv';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
 
// ...
 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
  redirect('/');
}


const storeContentInCache = async (hash: string, content: string) => {
  const session = await auth();
  if(session) {
    const { user } = session;
    if(user) {
      const {name} = user;
      const shared: SharedContent = {
        content,
        who:name||"user", view: 0,
        id: cuid2.createId()
      }
      await kv.set(hash, shared, { ex: 3600 }); // Expire after 1 hour
    }
  }
  // Assuming you have a KV cache client set up
  
}

export {storeContentInCache};