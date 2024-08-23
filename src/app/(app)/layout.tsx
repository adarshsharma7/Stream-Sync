"use client"
import { usePathname } from 'next/navigation';
import ButtonNavigation from '@/components/buttonNavigation';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname();

  // Check if the current path starts with "/videoplay"
  const isVideoPlayPage = pathname.startsWith('/videoplay');

  return (
    <> 
      {children}
      {!isVideoPlayPage && <ButtonNavigation />}
    </>
  );
}
