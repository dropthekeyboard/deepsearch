
// app/md/[encodedChat]/layout.tsx
export const metadata = {
    title: 'Shared Message',
    description: 'View a shared message from our chat application.',
  };
  
  export default function Layout({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen">{children}</div>;
  }