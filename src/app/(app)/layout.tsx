"use client"
import { usePathname } from 'next/navigation';
import ButtonNavigation from '@/components/buttonNavigation';
import { useMediaQuery } from 'react-responsive';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname();

  // Check if the current path starts with "/videoplay"
  const isVideoPlayPage = pathname.startsWith('/videoplay');

  // Check if the screen is medium or larger
  const isMdScreen = useMediaQuery({ query: '(min-width: 768px)' });

  return (
    <> 
      {children}
      {!(isVideoPlayPage && isMdScreen) && <ButtonNavigation />}
    </>
  );
}
