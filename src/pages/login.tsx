import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';

interface IFormInput {
  login: string;
  password: string;
}

const Login = () => {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<IFormInput>();
  const [error, setError] = useState('');
  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    try {
      const res = await axios.post('/api/login', data);
      
      if (res.status === 200) {
        console.log('User data:', res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        console.log('LocalStorage after setting user:', localStorage.getItem('user')); // Проверьте содержимое LocalStorage
        
        router.push('/PhotoIdentification');
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input-field">
            <input
              type="text"
              placeholder="Логин"
              {...register('login', { required: true })}
              style={{ color: '#000' }} // текст в поле ввода будет черным
            />
            {errors.login && <span className="error">Логин обязателен</span>}
          </div>
          <div className="input-field">
            <input
              type="password"
              placeholder="Пароль"
              {...register('password', { required: true })}
              style={{ color: '#000' }} // текст в поле ввода будет черным
            />
            {errors.password && <span className="error">Пароль обязателен</span>}
          </div>
          <button type="submit" className="btn-primary">Войти</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
      <style jsx>{`
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: url('/images/fon.jpg') no-repeat center center fixed;
          background-size: cover;
        }
        .form-container {
          background: rgba(0, 0, 0, 0.7);
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 100%;
          color: #fff;
        }
        h2 {
          text-align: center;
          margin-bottom: 20px;
          color: #fff;
        }
        .input-field {
          margin-bottom: 15px;
        }
        .input-field input {
          width: calc(100% - 20px);
          padding: 10px;
          border: none;
          border-radius: 5px;
          margin-bottom: 5px;
          background-color: #fff;
        }
        .error {
          color: red;
          font-size: 14px;
          margin-top: -10px;
          margin-bottom: 10px;
        }
        .btn-primary {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 5px;
          background-color: #555;
          color: #fff;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .btn-primary:hover {
          background-color: #333;
        }
        .btn-primary:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default Login;
