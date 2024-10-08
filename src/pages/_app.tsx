import '../app/globals.css';
import '../app/Gallery.module.css';
import 'tailwindcss/tailwind.css';
import '../components/PhotoViewer.module.css';
import '../components/PhotoViewer.tsx';
import Header from '../components/Header';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const publicPaths = ['/login'];
    const path = router.asPath.split('?')[0];

    const user = localStorage.getItem('user');
    if (!user && !publicPaths.includes(path)) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
