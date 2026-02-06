import ExportPage from "@/components/ExportPage";

// Get API URL from environment
const apiUrl = process.env.EXPORT_API_URL || "http://localhost:4000";

// Fetch products from Export API
async function getProducts() {

  try {
    const res = await fetch(`${apiUrl}/product`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Export API] Failed to fetch products: ${res.status}`, body);
      return { data: [], error: `API returned ${res.status}` };
    }

    const data = await res.json();
    return { data: data?.data ?? [], error: null };
  } catch (error) {
    console.error("[Export API] Connection error:", error.message);
    return { data: [], error: error.message };
  }
}

export default async function ExportPageRoute() {
  const { data: products, error } = await getProducts();

  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-red-400 font-medium">Failed to load products</p>
                <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}
        <ExportPage initialProducts={products} apiUrl={apiUrl} />
      </div>
    </div>
  );
}
