"use client";
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Logo() {
    const [mounted, setMounted] = useState(false);
    const { theme, systemTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    let logo = theme === 'dark' ? "/logo_dark.png" : "/logo.png";
    if(theme === 'system') {
        logo = systemTheme === 'dark'? "/logo_dark.png" : "/logo.png";
    }

    if (!mounted) {
        return <Skeleton className="h-10 w-10 rounded-full" />;
    }

    return <Image src={logo} alt='logo' width={128} height={128} className='h-10 w-10' unoptimized />
}
