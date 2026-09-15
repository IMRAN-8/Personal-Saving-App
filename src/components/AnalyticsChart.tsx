import { useState, useEffect } from 'react';
import { Entry } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, subMonths } from 'date-fns';

type ChartData = {
  month: string;
  earning: number;
  expense: number;
};

export default function AnalyticsChart({ entries }: { entries: Entry[] }) {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    // Process entries to group by month for the last 3 months
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);
    
    const monthlyData: Record<string, ChartData> = {};
    
    // Initialize the last 3 months with 0
    for (let i = 2; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = format(date, 'MMM yyyy');
      monthlyData[monthKey] = { month: monthKey, earning: 0, expense: 0 };
    }

    entries.forEach(entry => {
      const entryDate = parseISO(entry.date);
      if (entryDate >= threeMonthsAgo) {
        const monthKey = format(entryDate, 'MMM yyyy');
        if (monthlyData[monthKey]) {
          const amount = parseFloat(entry.amount);
          if (entry.type === 'earning') {
            monthlyData[monthKey].earning += amount;
          } else {
            monthlyData[monthKey].expense += amount;
          }
        }
      }
    });

    setData(Object.values(monthlyData));
  }, [entries]);

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-neutral-400">No data available for the last 3 months</div>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 0,
            left: -20,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} dx={-10} />
          <Tooltip 
            cursor={{ fill: '#f5f5f5' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="earning" name="Earnings" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
