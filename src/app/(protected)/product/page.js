import ProductGrid from "@/components/ProductGrid";

async function getProducts() {
  const apiUrl = process.env.EXPORT_API_URL || "http://localhost:3000";
  console.log(`${apiUrl}/product`);
  const res = await fetch(`${apiUrl}/product`, {
    cache: "no-store",
  });


  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

export default async function ProductPage() {
  const productsData = await getProducts();
  const products = productsData.data || [];

  return (
    <div className="relative p-8 bg-transparent">
      <div className="relative max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
        <ProductGrid initialProducts={products} />
      </div>
    </div>
  );
}
