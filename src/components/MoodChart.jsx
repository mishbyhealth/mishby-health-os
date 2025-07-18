import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const LOCAL_STORAGE_KEY = 'mishby.emotions.entries';

const MoodChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const savedEntries = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];

    const moodMap = {};
    savedEntries.forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      if (!moodMap[date]) moodMap[date] = {};
      if (!moodMap[date][entry.mood]) moodMap[date][entry.mood] = 0;
      moodMap[date][entry.mood]++;
    });

    const dates = Object.keys(moodMap).sort();
    const moods = ['😌', '😭', '😤', '😄', '😬'];

    const datasets = moods.map((mood) => ({
      label: mood,
      data: dates.map((date) => moodMap[date]?.[mood] || 0),
      backgroundColor: {
        '😌': '#c8e6c9',
        '😭': '#ffcdd2',
        '😤': '#ffcc80',
        '😄': '#fff59d',
        '😬': '#b3e5fc'
      }[mood]
    }));

    setChartData({
      labels: dates,
      datasets
    });
  }, []);

  return (
    <div className="mood-chart-container">
      <h3>📈 Mood Timeline</h3>
      {chartData ? (
        <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
      ) : (
        <p>Loading chart...</p>
      )}
    </div>
  );
};

export default MoodChart;
