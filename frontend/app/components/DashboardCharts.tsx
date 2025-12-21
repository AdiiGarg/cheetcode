'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from 'recharts';

export default function DashboardCharts({
  stats,
}: {
  stats: { total: number; easy: number; medium: number; hard: number };
}) {
  const pieData = [
    { name: 'Easy', value: stats.easy },
    { name: 'Medium', value: stats.medium },
    { name: 'Hard', value: stats.hard },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
      {/* PIE */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Difficulty Breakdown
        </h2>

        <div className="flex justify-center">
          <PieChart width={300} height={300}>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
            >
              {['#34d399', '#60a5fa', '#f87171'].map((c, i) => (
                <Cell key={i} fill={c} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* BAR */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Problems Solved
        </h2>

        <BarChart
          width={300}
          height={300}
          data={[{ name: 'Solved', value: stats.total }]}
        >
          <XAxis dataKey="name" />
          <Tooltip />
          <Bar dataKey="value" fill="#34d399" />
        </BarChart>
      </div>
    </div>
  );
}
