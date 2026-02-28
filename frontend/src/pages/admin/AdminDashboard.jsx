import React from 'react';
import AdminLayout from './AdminLayout';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function AdminDashboard() {
  // Stats data with pastel colors
  const stats = [
    {
      title: 'Total Revenue',
      value: '₱385,000',
      change: '+12.5% from last month',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      cardBg: 'bg-gradient-to-br from-red-50 to-pink-50',
      borderColor: 'border-red-100'
    },
    {
      title: 'Total Customers',
      value: '1,247',
      change: '+8.2% from last month',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      cardBg: 'bg-gradient-to-br from-red-50 to-orange-50',
      borderColor: 'border-red-100'
    },
    {
      title: 'Services Completed',
      value: '883',
      change: '+15.3% from last month',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      cardBg: 'bg-gradient-to-br from-red-50 to-pink-50',
      borderColor: 'border-red-100'
    },
    {
      title: 'Avg. Satisfaction',
      value: '89%',
      change: '+2.1% from last month',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      cardBg: 'bg-gradient-to-br from-red-50 to-amber-50',
      borderColor: 'border-red-100'
    }
  ];

  // Line chart data for Revenue & Services Trend with original colors
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (₱)',
        data: [50000, 52000, 48000, 58000, 61000, 70000],
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Services',
        data: [120, 135, 125, 138, 145, 165],
        borderColor: '#1f2937',
        backgroundColor: 'rgba(31, 41, 55, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
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
        display: true,
        position: 'bottom'
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    }
  };

  // Doughnut chart data for Service Distribution with original colors
  const doughnutChartData = {
    labels: ['Oil Change', 'Tire Service', 'Engine Repair', 'Body Work', 'Other'],
    datasets: [
      {
        data: [35, 25, 20, 12, 8],
        backgroundColor: [
          '#dc2626', // Red
          '#1f2937', // Dark gray
          '#6b7280', // Gray
          '#ef4444', // Light red
          '#374151'  // Medium gray
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <AdminLayout
      title=""
      subtitle=""
    >
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950/50 -m-8 p-8">
        {/* Admin Dashboard Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
        </div>

        {/* Stats Cards with Pastel Gradient Backgrounds */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`${stat.cardBg} rounded-xl p-6 shadow-sm border-2 ${stat.borderColor}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                </div>
                <div className={`${stat.iconBg} ${stat.iconColor} p-3 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <svg className={`w-4 h-4 ${stat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className={`${stat.iconColor} font-medium`}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row with Pastel Backgrounds */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Line Chart - Revenue & Services Trend */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue & Services Trend</h3>
            <div className="h-80">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Doughnut Chart - Service Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Service Distribution</h3>
            <div className="h-64 flex items-center justify-center mb-6">
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            </div>
            {/* Legend */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="text-sm text-gray-600">Oil Change</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                  <span className="text-sm text-gray-600">Tire Service</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">25%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Engine Repair</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Body Work</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">12%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-700 rounded-full"></div>
                  <span className="text-sm text-gray-600">Other</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">8%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;