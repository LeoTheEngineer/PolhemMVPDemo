export default function DashboardLoading() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
            <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse mt-2" />
            <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse mt-2" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 h-48">
            <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
