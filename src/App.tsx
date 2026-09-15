import { useEffect, useState } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import Login from './components/Login';
import TransactionForm from './components/TransactionForm';
import AnalyticsChart from './components/AnalyticsChart';
import { DashboardData, Entry } from './types';
import { LogOut, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUser(currentUser);
        await fetchDashboard(currentUser);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const syncUser = async (user: FirebaseUser) => {
    try {
      const token = await user.getIdToken();
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to sync user", err);
    }
  };

  const fetchDashboard = async (currentUser = user) => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddTransaction = async (transaction: { amount: number; type: 'earning' | 'expense'; note: string; date: string }) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(transaction)
      });
      if (!res.ok) throw new Error('Failed to save transaction');
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-500">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-12">
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Wallet className="text-blue-600" />
            Personal Saving
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-600 hidden sm:block">{user.email}</span>
            <button
              onClick={() => auth.signOut()}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-500 mb-1">Current Balance</h3>
            <p className="text-3xl font-bold tracking-tight">${data?.balance?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-500 mb-1 flex items-center gap-2">
              Total Earnings <TrendingUp size={16} className="text-emerald-500" />
            </h3>
            <p className="text-2xl font-semibold text-emerald-600 tracking-tight">${data?.totalEarning?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-500 mb-1 flex items-center gap-2">
              Total Expenses <TrendingDown size={16} className="text-red-500" />
            </h3>
            <p className="text-2xl font-semibold text-red-600 tracking-tight">${data?.totalExpense?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content: Chart & History */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-bold mb-6 tracking-tight">Analytics (Last 3 Months)</h2>
              {loadingData ? (
                <div className="h-80 flex items-center justify-center text-neutral-400">Loading chart...</div>
              ) : (
                <AnalyticsChart entries={data?.entries || []} />
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-bold mb-4 tracking-tight">Transaction History</h2>
              {loadingData ? (
                <div className="py-8 text-center text-neutral-500">Loading history...</div>
              ) : data?.entries?.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
                  No transactions yet. Add one to get started!
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.entries?.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${entry.type === 'earning' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {entry.type === 'earning' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{entry.note || (entry.type === 'earning' ? 'Earning' : 'Expense')}</p>
                          <p className="text-sm text-neutral-500">{format(parseISO(entry.date), 'MMMM d, yyyy')}</p>
                        </div>
                      </div>
                      <div className={`font-bold ${entry.type === 'earning' ? 'text-emerald-600' : 'text-neutral-900'}`}>
                        {entry.type === 'earning' ? '+' : '-'}${Number(entry.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Form */}
          <div className="lg:col-span-1 sticky top-24">
            <TransactionForm onSubmit={handleAddTransaction} isLoading={submitting} />
          </div>
        </div>
      </main>
    </div>
  );
}

