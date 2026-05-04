const SkeletonCard = () => (
  <div className="bg-gray-900 rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-video bg-gray-800" />
    <div className="p-6 flex flex-col gap-3">
      <div className="h-3 w-24 bg-gray-800 rounded" />
      <div className="h-5 bg-gray-800 rounded w-full" />
      <div className="h-5 bg-gray-800 rounded w-3/4" />
      <div className="flex items-center justify-between mt-2">
        <div className="h-6 w-20 bg-gray-800 rounded" />
        <div className="h-5 w-16 bg-gray-800 rounded-full" />
      </div>
      <div className="h-10 bg-gray-800 rounded-lg mt-2" />
    </div>
  </div>
)

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
