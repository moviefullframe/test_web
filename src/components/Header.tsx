import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

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

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/" legacyBehavior>
          <a>MyUniqueSite</a>
        </Link>
      </div>
      <nav className={`${styles.nav} ${!isAuthenticated ? styles.center : ''}`}>
        <Link href="/" legacyBehavior>
          <a>Главная</a>
        </Link>
        {isAuthenticated && (
          <>
            <Link href="/galery" legacyBehavior>
              <a>Галерея</a>
            </Link>
            <Link href="/orders" legacyBehavior>
              <a>Заказы</a>
            </Link>
            <Link href="/contacts" legacyBehavior>
              <a>Контакты</a>
            </Link>
            <button className={styles.logoutButton} onClick={handleLogout}>
              Выход
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
