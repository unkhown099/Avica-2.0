import React from 'react';
import BranchOwnerLayout from './BranchOwnerLayout';
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

function BranchOwnerDashboard() {
  // Stats data
  const stats = [
    {
      title: 'Total Revenue',
      value: '₱457,000',
      change: '+15.3% from last month',
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
      title: 'Total Branches',
      value: '5',
      change: 'Across all locations',
      trend: 'neutral',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      borderColor: 'border-blue-100'
    },
    {
      title: 'Services Completed',
      value: '1,525',
      change: '+12.8% from last month',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
      cardBg: 'bg-gradient-to-br from-purple-50 to-violet-50',
      borderColor: 'border-purple-100'
    },
    {
      title: 'Avg. Satisfaction',
      value: '88%',
      change: '+3.2% from last month',
      trend: 'up',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      cardBg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-100'
    }
  ];

  // Line chart data for Revenue Trend
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (₱)',
        data: [350000, 380000, 360000, 420000, 450000, 457000],
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  // Doughnut chart data for Branch Performance
  const doughnutChartData = {
    labels: ['San Mateo Rizal', 'South Caloocan', 'Quezon City', 'North Caloocan', 'Camarin'],
    datasets: [
      {
        data: [125000, 98000, 82000, 87000, 65000],
        backgroundColor: [
          '#dc2626',
          '#1f2937',
          '#6b7280',
          '#ef4444',
          '#374151'
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

  // Top performing branches
  const topBranches = [
    { name: 'San Mateo Rizal', revenue: '₱125,000', services: 450, satisfaction: 92 },
    { name: 'South Caloocan', revenue: '₱98,000', services: 320, satisfaction: 88 },
    { name: 'Quezon City', revenue: '₱82,000', services: 265, satisfaction: 90 }
  ];

  return (
    <BranchOwnerLayout 
      title="Dashboard" 
      subtitle="Welcome to Otokwikk - Branch Owner Management System"
    >
      {/* Stats Cards */}
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
              {stat.trend === 'up' && (
                <svg className={`w-4 h-4 ${stat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              <span className={stat.trend === 'up' ? stat.iconColor : 'text-gray-600'}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Line Chart - Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend</h3>
          <div className="h-80">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Doughnut Chart - Branch Revenue Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Branch Revenue Distribution</h3>
          <div className="h-64 flex items-center justify-center mb-6">
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          </div>
          {/* Legend */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span className="text-sm text-gray-600">San Mateo Rizal</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">₱125k</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                <span className="text-sm text-gray-600">South Caloocan</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">₱98k</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Quezon City</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">₱82k</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-sm text-gray-600">North Caloocan</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">₱87k</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-700 rounded-full"></div>
                <span className="text-sm text-gray-600">Camarin</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">₱65k</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Branches */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Top Performing Branches</h3>
        <div className="space-y-4">
          {topBranches.map((branch, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 font-bold rounded-lg">
                  #{index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{branch.name}</h4>
                  <p className="text-sm text-gray-600">{branch.services} services completed</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="font-bold text-gray-900">{branch.revenue}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Satisfaction</p>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-gray-900">{branch.satisfaction}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BranchOwnerLayout>
  );
}

export default BranchOwnerDashboard;