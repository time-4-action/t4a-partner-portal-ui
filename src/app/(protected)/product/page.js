import { auth0 } from "@/lib/auth0";
import ProductGrid from "@/components/ProductGrid";

async function getProducts() {
  // ✅ Get a proper API access token (best practice with nextjs-auth0)
  const {  token } = await auth0.getAccessToken({
    authorizationParams: {
      // Must match your Auth0 API Identifier (Audience)
      audience: 'https://api.time-4-action.com',
      // If you use API scopes, add them here:
      scope: "read:products",
    },
    refresh: true,
  });
  console.log(token);

  // Safe debug (does not leak token)
  console.log("accessToken segments:", token?.split(".").length);

  if (!token) {
    throw new Error("Not authenticated to fetch products.");
  }

  // ✅ Stronger env handling
  const apiUrl =
    process.env.EXPORT_API_URL ||
    process.env.NEXT_PUBLIC_EXPORT_API_URL ||
    "http://localhost:4000"; // <-- default to your API port (not Next.js port)

  const res = await fetch(`${apiUrl}/product`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
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
