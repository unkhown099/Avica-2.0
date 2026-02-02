import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function AdminReports() {
  const [selectedYear, setSelectedYear] = useState('2026');

  // Financial stats
  const stats = [
    {
      label: 'Total Revenue (YTD)',
      value: '₱2,527,000',
      change: '+9.8% from last year',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100'
    },
    {
      label: 'Total Expenses (YTD)',
      value: '₱1,470,000',
      change: '58.2% of revenue',
      trend: 'neutral',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconColor: 'text-gray-900',
      iconBg: 'bg-gray-100'
    },
    {
      label: 'Net Profit (YTD)',
      value: '₱1,057,000',
      change: '+11.2% from last year',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    {
      label: 'Profit Margin',
      value: '41.8%',
      change: '+0.6% from last year',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100'
    }
  ];

  // Line chart data
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [380000, 400000, 390000, 385000, 440000, 445000, 438000, 452000, 425000, 460000, 468000, 480000],
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Expenses',
        data: [220000, 240000, 235000, 232000, 255000, 260000, 252000, 265000, 248000, 270000, 275000, 280000],
        borderColor: '#1f2937',
        backgroundColor: 'rgba(31, 41, 55, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Profit',
        data: [160000, 160000, 155000, 153000, 185000, 185000, 186000, 187000, 177000, 190000, 193000, 200000],
        borderColor: '#9ca3af',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return '₱' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <AdminLayout 
      title="Financial Reports" 
      subtitle="Comprehensive financial analytics and reporting"
    >
      {/* Header with Export Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
          >
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>
        <button className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Report
        </button>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              </div>
              <div className={`${stat.iconBg} ${stat.iconColor} p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {stat.trend === 'up' && (
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              <span className={stat.trend === 'up' ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue, Expenses & Profit Trend Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue, Expenses & Profit Trend</h3>
        <div className="h-96">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-center gap-8 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
            <span className="text-sm text-gray-600">Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Profit</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminReports;