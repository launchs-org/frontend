import { useState } from 'react';
import { login } from '../services/auth';

export const Login = ({ onSwitch }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      localStorage.setItem('token', data.token);
      alert('ログインしました');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded">
      <h2 className="text-xl mb-4">ログイン</h2>
      <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} className="block w-full mb-2 p-2 border" />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} className="block w-full mb-2 p-2 border" />
      <button className="w-full bg-blue-500 text-white p-2">ログイン</button>
      <button type="button" onClick={onSwitch} className="w-full mt-2 text-sm underline">新規登録へ</button>
    </form>
  );
};
