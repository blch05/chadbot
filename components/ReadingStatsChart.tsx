'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ReadingStatsChart({ booksByPeriod }: { booksByPeriod: Array<{ year: number; month: number; count: number }> }) {
  // Normalize and sort
  const items = (booksByPeriod || [])
    .map((b) => ({ label: `${b.year}-${String(b.month).padStart(2, '0')}`, count: b.count }))
    .sort((a, b) => (a.label > b.label ? 1 : -1));

  const labels = items.map((i) => i.label);
  const data = {
    labels,
    datasets: [
      {
        label: 'Libros leídos',
        data: items.map((i) => i.count),
        backgroundColor: 'rgba(77,90,68,0.9)',
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Libros leídos por mes' },
    },
    scales: {
      x: { ticks: { color: '#ffffff' }, grid: { display: false } },
      y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
    },
  };

  return (
    <div style={{ height: 220, width: '100%' }}>
      <Bar options={options} data={data} />
    </div>
  );
}
