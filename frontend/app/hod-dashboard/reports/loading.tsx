'use client';

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Loading Skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Filters Loading Skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      {/* Table Loading Skeleton */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 flex items-center px-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/5 mr-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6 mr-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6 mr-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
          
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="border-t border-gray-100 h-16 flex items-center px-6">
              <div className="h-5 bg-gray-200 rounded w-1/4 mr-4"></div>
              <div className="h-5 bg-gray-200 rounded w-1/5 mr-4"></div>
              <div className="h-5 bg-gray-200 rounded w-12 mr-4"></div>
              <div className="h-8 bg-gray-200 rounded-full w-16 mr-4"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
