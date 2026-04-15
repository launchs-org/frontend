import { useState } from 'react';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';

function App() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex justify-center items-center h-screen">
      {isLogin ? (
        <Login onSwitch={() => setIsLogin(false)} />
      ) : (
        <SignUp onSwitch={() => setIsLogin(true)} />
      )}
    </div>
  );
}

export default App;
