export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-konkan-cream/80">
      {/* Simulated sidebar — hidden on mobile, shown on lg */}
      <aside className="fixed top-0 left-0 z-30 h-screen w-64 bg-konkan-earth hidden lg:flex flex-col">
        {/* Brand */}
        <div className="flex items-center h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-konkan-saffron/50 animate-pulse" />
            <div className="space-y-1">
              <div className="w-24 h-3 rounded bg-white/10 animate-pulse" />
              <div className="w-16 h-2 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-5">
          {[1, 2, 3, 4, 5, 6].map((section) => (
            <div key={section}>
              <div className="w-16 h-2 rounded bg-white/5 animate-pulse mb-2 ml-3" />
              <div className="space-y-0.5">
                {[1, 2].map((item) => (
                  <div key={item} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-5 h-5 rounded bg-white/10 animate-pulse" />
                    <div className="w-20 h-3 rounded bg-white/10 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-5 h-5 rounded bg-white/10 animate-pulse" />
            <div className="w-12 h-3 rounded bg-white/10 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:ml-64">
        {/* Header bar skeleton */}
        <header className="sticky top-0 z-20 bg-white border-b border-konkan-sand/50">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-konkan-sand/50 animate-pulse lg:hidden" />
              <div className="space-y-1">
                <div className="w-24 h-3 rounded bg-konkan-sand/50 animate-pulse" />
                <div className="w-16 h-2 rounded bg-konkan-sand/30 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-konkan-sand/50 animate-pulse" />
              <div className="w-8 h-8 rounded-lg bg-konkan-sand/50 animate-pulse" />
              <div className="w-px h-6 bg-konkan-sand" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-konkan-sand/50 animate-pulse" />
                <div className="space-y-1 hidden sm:block">
                  <div className="w-12 h-2 rounded bg-konkan-sand/50 animate-pulse" />
                  <div className="w-20 h-2 rounded bg-konkan-sand/30 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content skeleton */}
        <div className="p-4 lg:p-6 space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="w-16 h-3 rounded bg-konkan-sand/50 animate-pulse mb-2" />
                <div className="w-24 h-6 rounded bg-konkan-sand/50 animate-pulse mb-1" />
                <div className="w-12 h-2 rounded bg-konkan-sand/30 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Charts area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="w-32 h-4 rounded bg-konkan-sand/50 animate-pulse mb-4" />
              <div className="h-[250px] rounded bg-konkan-sand/20 animate-pulse" />
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="w-32 h-4 rounded bg-konkan-sand/50 animate-pulse mb-4" />
              <div className="h-[250px] rounded bg-konkan-sand/20 animate-pulse" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="w-40 h-4 rounded bg-konkan-sand/50 animate-pulse" />
            </div>
            <div className="divide-y divide-gray-50">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="flex items-center gap-4 p-4">
                  <div className="w-8 h-8 rounded bg-konkan-sand/30 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="w-3/4 h-3 rounded bg-konkan-sand/50 animate-pulse" />
                    <div className="w-1/2 h-2 rounded bg-konkan-sand/30 animate-pulse" />
                  </div>
                  <div className="w-16 h-3 rounded bg-konkan-sand/30 animate-pulse" />
                  <div className="w-20 h-6 rounded-full bg-konkan-sand/30 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
