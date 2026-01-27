import Link from "next/link";
import ProductVariants from "@/components/ProductVariants";


const ProductNotFound = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 text-white">
    Product not found.
  </div>
);

async function getProduct(token) {
  const apiUrl = process.env.PRODUCT_API_URL || "http://localhost:3000";
  const res = await fetch(`${apiUrl}/product/${token}`, {
    cache: "no-store",
  });

  console.log(`${apiUrl}/product/${token}`);


  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch product");
  }

  return res.json();
}

export default async function ProductDetailPage({ params }) {
  // When a page is dynamically rendered, params can be a promise. We await it to get the resolved value.
  const resolvedParams = await params;
  const { token } = resolvedParams;

  if (!token) {
    return <ProductNotFound />;
  }

  const productData = await getProduct(token);

  // Check if the API returned a valid product object within the 'data' property
  if (!productData || !productData.data) {
    return <ProductNotFound />;
  }

  const product = productData.data;

  return (
    <div className="relative p-4 sm:p-6 md:p-8">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
        <div className="mb-6">
          <Link href="/product" className="text-cyan-400 hover:text-cyan-300">
            &larr; Back to Products
          </Link>
        </div>

        <ProductVariants product={product} />
      </div>
    </div>
  );
}
