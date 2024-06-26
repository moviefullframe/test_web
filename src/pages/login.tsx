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
        localStorage.setItem('user', JSON.stringify(res.data));
        router.push('/galery');
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
            />
            {errors.login && <span className="error">Логин обязателен</span>}
          </div>
          <div className="input-field">
            <input
              type="password"
              placeholder="Пароль"
              {...register('password', { required: true })}
            />
            {errors.password && <span className="error">Пароль обязателен</span>}
          </div>
          <button type="submit" className="btn-primary">LOGIN</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
