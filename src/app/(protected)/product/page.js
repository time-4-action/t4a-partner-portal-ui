import { auth0 } from "@/lib/auth0";
import ProductGrid from "@/components/ProductGrid";

async function getProducts() {
    // ✅ Stronger env handling
  const apiUrl =
    process.env.EXPORT_API_URL ||
    process.env.NEXT_PUBLIC_EXPORT_API_URL ||
    "http://localhost:4000"; // <-- default to your API port (not Next.js port)

  const res = await fetch(`${apiUrl}/product`, {
    cache: "no-store"
  });

  if (!res.ok) {
    // Helpful error for debugging
    const body = await res.text().catch(() => "");
    console.error("API error:", res.status, body);
    throw new Error(`Failed to fetch products (${res.status})`);
  }

  return res.json();
}

export default async function ProductPage() {
  const productsData = await getProducts();
  const products = productsData?.data ?? [];

  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        <ProductGrid initialProducts={products} />
      </div>
    </div>
  );
}
