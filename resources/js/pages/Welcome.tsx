import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
  return (
    <>
      <Head title="FanTL - Webnovel Platform" />
      
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              FanTL Webnovel
            </h1>
            <p className="text-gray-600 mb-8">
              Welcome to FanTL - Your favorite webnovel platform
            </p>
            
            <div className="space-y-4">
              <Link
                href="/admin"
                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Admin Dashboard
              </Link>
              
              <div className="text-sm text-gray-500">
                <p>Demo Admin Credentials:</p>
                <p>Email: admin@fantl.com</p>
                <p>Password: password</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 FanTL. Built with Laravel + React + TypeScript</p>
        </div>
      </div>
    </>
  );
}
