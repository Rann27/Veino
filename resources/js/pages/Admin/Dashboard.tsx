import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

interface Stats {
  total_users: number;
  total_series: number;
  total_chapters: number;
  premium_chapters: number;
  recent_series: Array<{
    id: number;
    title: string;
    status: string;
    native_language: {
      name: string;
    };
    created_at: string;
  }>;
  recent_chapters: Array<{
    id: number;
    title: string;
    chapter_number: number;
    is_premium: boolean;
    series: {
      title: string;
    };
    created_at: string;
  }>;
}

interface DashboardProps {
  stats: Stats;
}

export default function Dashboard({ stats }: DashboardProps) {
  return (
    <AdminLayout title="Dashboard">
      <Head title="Admin Dashboard" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">U</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total_users}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">S</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Series</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total_series}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">C</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Chapters</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total_chapters}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Premium Chapters</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.premium_chapters}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Series */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Series</h3>
            <div className="space-y-3">
              {stats.recent_series.map((series) => (
                <div key={series.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{series.title}</p>
                    <p className="text-sm text-gray-500">
                      {series.native_language.name} • {series.status}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(series.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Chapters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Chapters</h3>
            <div className="space-y-3">
              {stats.recent_chapters.map((chapter) => (
                <div key={chapter.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {chapter.series.title} - Ch. {chapter.chapter_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {chapter.title}
                      {chapter.is_premium && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Premium
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(chapter.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
