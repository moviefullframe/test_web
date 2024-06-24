import { useRouter } from 'next/router';
import { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    try {
      const res = await axios.post('/api/login', { login, password });
      
      if (res.status === 200) {
        localStorage.setItem('user', JSON.stringify(res.data));
        router.push('/gallery');
      } else {
        setError('Неверный логин или пароль');
      }
    } catch (error) {
      setError('Ошибка при авторизации');
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2>Авторизация</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-field">
            <input
              type="text"
              placeholder="Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
          <div className="input-field">
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">LOGIN</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
