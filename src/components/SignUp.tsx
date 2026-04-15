import { useState } from 'react';
import { signUp } from '../services/auth';

export const SignUp = ({ onSwitch }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signUp(username, password, email);
      alert('登録しました');
      onSwitch();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded">
      <h2 className="text-xl mb-4">新規登録</h2>
      <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} className="block w-full mb-2 p-2 border" />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} className="block w-full mb-2 p-2 border" />
      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} className="block w-full mb-2 p-2 border" />
      <button className="w-full bg-blue-500 text-white p-2">登録</button>
      <button type="button" onClick={onSwitch} className="w-full mt-2 text-sm underline">ログインへ</button>
    </form>
  );
};
