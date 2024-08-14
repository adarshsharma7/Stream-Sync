import ButtonNavigation from '@/components/buttonNavigation'


interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    
    <> 
    {children}
      <ButtonNavigation/>
    </>
     
  
  );
}


