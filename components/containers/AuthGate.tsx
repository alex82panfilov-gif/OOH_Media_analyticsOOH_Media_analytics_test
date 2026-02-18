import React from 'react';

interface AuthGateProps {
  password: string;
  loginError: boolean;
  isAuthLoading: boolean;
  setPassword: (password: string) => void;
  handleLogin: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  password,
  loginError,
  isAuthLoading,
  setPassword,
  handleLogin,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
    <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">OOH <span className="text-teal-600">Analytics</span></h1>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className={`w-full px-6 py-4 rounded-2xl border-2 outline-none ${loginError ? 'border-red-500 bg-red-50' : 'border-gray-100 focus:border-teal-500 bg-gray-50'}`} />
        <button type="submit" disabled={isAuthLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 disabled:bg-gray-400 shadow-lg">{isAuthLoading ? 'Проверка...' : 'Войти'}</button>
        {loginError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">Неверный пароль</p>}
      </form>
    </div>
  </div>
);
