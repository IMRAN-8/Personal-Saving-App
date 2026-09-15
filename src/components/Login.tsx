import { auth, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { LogIn, Wallet } from 'lucide-react';

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <Wallet size={32} />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Personal Saving</h1>
        <p className="text-neutral-500 text-lg">Track your earnings and expenses simply and securely.</p>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 px-6 rounded-xl transition-colors mt-8"
        >
          <LogIn size={20} />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
