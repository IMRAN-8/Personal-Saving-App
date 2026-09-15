import React, { useState } from 'react';

type TransactionFormProps = {
  onSubmit: (data: { amount: number; type: 'earning' | 'expense'; note: string; date: string }) => Promise<void>;
  isLoading: boolean;
};

export default function TransactionForm({ onSubmit, isLoading }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'earning' | 'expense'>('expense');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    await onSubmit({
      amount: Number(amount),
      type,
      note,
      date,
    });
    
    setAmount('');
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Add Transaction</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`py-2 px-4 rounded-xl font-medium transition-colors ${type === 'expense' ? 'bg-red-50 text-red-700 border-2 border-red-200' : 'bg-neutral-50 text-neutral-600 border-2 border-transparent hover:bg-neutral-100'}`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType('earning')}
          className={`py-2 px-4 rounded-xl font-medium transition-colors ${type === 'earning' ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200' : 'bg-neutral-50 text-neutral-600 border-2 border-transparent hover:bg-neutral-100'}`}
        >
          Earning
        </button>
      </div>

      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g., Groceries"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-neutral-900 text-white font-medium py-3 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 mt-2"
      >
        {isLoading ? 'Saving...' : 'Save Transaction'}
      </button>
    </form>
  );
}
