import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  DocumentReportIcon,
  ExclamationIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  UsersIcon,
  LightningBoltIcon,
  ClockIcon,
} from '@heroicons/react/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Card } from '@components/common/Card';
import { StatCard } from '@components/dashboard/StatCard';
import { AlertsList } from '@components/dashboard/AlertsList';
import { ComplianceGauge } from '@components/dashboard/ComplianceGauge';
import { QuickActions } from '@components/dashboard/QuickActions';
import { useAuth } from '@hooks/useAuth';
import { dashboardService } from '@services/dashboard.service';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboardData,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={t('errors.generalError')} />;
  }

  const {
    complianceScore,
    activeAlerts,
    pendingActions,
    upcomingDeadlines,
    esgMetrics,
    complianceTrend,
    recentActivity,
  } = dashboardData || {};

  // Mock data for charts (in production, this would come from the API)
  const complianceTrendData = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'dd.MM', { locale: pl }),
    score: Math.floor(Math.random() * 20) + 75,
  }));

  const esgDistribution = [
    { name: t('dashboard.environmental'), value: 35, color: '#10B981' },
    { name: t('dashboard.social'), value: 30, color: '#3B82F6' },
    { name: t('dashboard.governance'), value: 35, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.welcome', { name: user?.firstName || 'User' })}
        </h1>
        <p className="mt-2 text-gray-600">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: pl })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.complianceScore')}
          value={`${complianceScore || 0}%`}
          icon={<ChartBarIcon className="h-6 w-6" />}
          trend={complianceScore > 80 ? 'up' : 'down'}
          trendValue="+2.5%"
          color="green"
        />
        <StatCard
          title={t('dashboard.activeAlerts')}
          value={activeAlerts || 0}
          icon={<ExclamationIcon className="h-6 w-6" />}
          trend={activeAlerts > 5 ? 'up' : 'down'}
          trendValue={activeAlerts > 5 ? '+3' : '-2'}
          color="red"
        />
        <StatCard
          title={t('dashboard.pendingActions')}
          value={pendingActions || 0}
          icon={<ClockIcon className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title={t('dashboard.upcomingDeadlines')}
          value={upcomingDeadlines || 0}
          icon={<DocumentReportIcon className="h-6 w-6" />}
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Gauge - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card title={t('dashboard.complianceScore')}>
            <div className="flex items-center justify-between">
              <ComplianceGauge score={complianceScore || 0} />
              <div className="flex-1 ml-8">
                <h3 className="text-lg font-semibold mb-4">
                  {t('dashboard.complianceTrend')}
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={complianceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card title={t('dashboard.quickStats')}>
            <QuickActions />
          </Card>
        </div>
      </div>

      {/* ESG Performance and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ESG Performance */}
        <Card title={t('dashboard.esgPerformance')}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={esgDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {esgDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 space-y-2">
            {esgDistribution.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-gray-600">{category.name}</span>
                </div>
                <span className="text-sm font-semibold">{category.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card title={t('dashboard.activeAlerts')}>
          <AlertsList alerts={recentActivity?.alerts || []} />
        </Card>
      </div>

      {/* Recent Activity */}
      <Card title={t('dashboard.recentActivity')}>
        <div className="space-y-4">
          {recentActivity?.activities?.map((activity: any, index: number) => (
            <div
              key={index}
              className="flex items-start space-x-3 pb-4 border-b border-gray-200 last:border-0"
            >
              <div className="flex-shrink-0">
                {activity.type === 'success' && (
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                )}
                {activity.type === 'warning' && (
                  <ExclamationIcon className="h-6 w-6 text-yellow-500" />
                )}
                {activity.type === 'info' && (
                  <LightningBoltIcon className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(activity.timestamp), 'dd.MM.yyyy HH:mm', { locale: pl })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;