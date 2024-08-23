import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const Header = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    router.push('/login');
  };

  const isGalleryPage = router.pathname === '/galery';

  const handleDevelopmentClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    alert('Данный раздел находится в разработке.');
  };

  return (
    <header className="flex justify-between items-center p-2 bg-gray-800 text-white w-full">
      {isAuthenticated && (
        <nav className="flex justify-center items-center gap-2 w-full">
          <Link href="/galery" legacyBehavior>
            <a className="text-white text-xs md:text-base">Галерея</a>
          </Link>
          <Link href="/orders" legacyBehavior>
            <a className="text-white text-xs md:text-base">Заказы</a>
          </Link>
          <a href="/contacts" className="text-white text-xs md:text-base" onClick={handleDevelopmentClick}>Контакты</a>
          <button className="bg-red-500 border-none px-2 md:px-4 py-1 md:py-2 text-white cursor-pointer rounded text-xs md:text-base" onClick={handleLogout}>
            Выход
          </button>
        </nav>
      )}
    </header>
  );
};

export default Header;
