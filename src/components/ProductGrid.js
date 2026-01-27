"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

function ProductCard({
  product,
  isSelected,
  onSelect,
  view,
  onProductNameClick,
}) {  const getMinPrice = () => {
    // useMemo will prevent recalculating the price on every render
    return useMemo(() => {
      if (!product.child_products || product.child_products.length === 0) {
        return "N/A";
      }

      const allPrices = product.child_products.flatMap(
        (child) =>
          child.pricelist
            ?.map((p) => p.price)
            .filter((price) => typeof price === "number") || []
      );

      if (allPrices.length === 0) {
        return "N/A";
      }

      const minPrice = Math.min(...allPrices);
      return `From €${minPrice.toFixed(2)}`;
    }, [product.child_products]);
  };

  const variations = product.child_products?.length || 0;
  const minPrice = getMinPrice();

  if (view === "list") {
    return (
      <div
        className={`relative flex flex-col sm:flex-row items-start sm:items-center rounded-lg transition-all duration-300 p-3 gap-4 cursor-pointer group bg-neutral-800/50 hover:bg-neutral-800 ${
          isSelected
            ? "bg-cyan-900/50 ring-2 ring-cyan-500"
            : "border-2 border-transparent"
        }`}
        onClick={() => onSelect(product.token)}
      >
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src={product.images[0] || "https://via.placeholder.com/100"}
            alt={product.product_name}
            layout="fill"
            objectFit="cover"
            className="bg-neutral-700 rounded-md transition-transform duration-300 ease-in-out group-hover:scale-110"
          />
        </div>
        <div className="flex-grow min-w-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex-grow min-w-0">
            <h3 className="text-md font-semibold text-white line-clamp-2">
              {product.product_name}
            </h3>
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0 sm:flex-shrink-0">
            <div className="w-28 text-left text-sm text-neutral-400">
              {variations} {variations === 1 ? "model" : "models"}
            </div>
            <div className="w-28 text-left text-sm font-semibold text-neutral-200">{minPrice}</div>
          </div>
        </div>
        <div className="w-full sm:w-auto sm:flex-shrink-0 sm:ml-auto mt-3 sm:mt-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProductNameClick(product.token);
            }}
            className="bg-neutral-700 hover:bg-cyan-700 text-white font-bold py-1 px-3 rounded-lg transition-colors duration-300 text-sm"
          >
            Details
          </button>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      className={`bg-neutral-800 rounded-lg overflow-hidden shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 flex flex-col h-full relative cursor-pointer group hover:scale-105 ${
        isSelected ? "ring-2 ring-cyan-500" : ""
      }`}
      onClick={() => onSelect(product.token)}
    >
      <div className="relative w-full aspect-square">
        <Image
          src={product.images[0] || "https://via.placeholder.com/400"}
          alt={product.product_name}
          layout="fill"
          objectFit="cover"
          className="bg-neutral-700"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-white mb-2 flex-grow line-clamp-2">
          {product.product_name}
        </h3>
        <div className="mt-auto pt-4">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs text-neutral-500">Price</p>
              <p className="text-xl font-bold text-white">{minPrice}</p>
            </div>
            <div className="text-right text-sm text-neutral-300">
              {variations} {variations === 1 ? "model" : "models"} available
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProductNameClick(product.token);
            }}
            className="w-full bg-neutral-700 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const updateMatches = () => {
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
    };
    updateMatches();
    media.addEventListener("change", updateMatches);
    return () => media.removeEventListener("change", updateMatches);
  }, [matches, query]);

  return matches;
}

export default function ProductGrid({ initialProducts = [] }) {
  const router = useRouter();
  const [products] = useState(initialProducts);
  const [view, setView] = useState("grid"); // 'grid' or 'list'
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [copyStatus, setCopyStatus] = useState("");
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // Load selection from local storage on initial client-side render
  useEffect(() => {
    const savedSelection = localStorage.getItem("selectedProductTokens");
    if (savedSelection) {
      setSelectedProducts(JSON.parse(savedSelection));
    }
  }, []);

  // Save selection to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("selectedProductTokens", JSON.stringify(selectedProducts));
  }, [selectedProducts]);

  const handleSelectProduct = (token) => {
    if (isDesktop) {
      setSelectedProducts((prevSelected) =>
        prevSelected.includes(token)
          ? prevSelected.filter((t) => t !== token)
          : [...prevSelected, token]
      );
    } else {
      handleProductNameClick(token);
    }
  };

  const handleCopyToClipboard = () => {
    if (selectedProducts.length === 0) return;
    const jsonString = JSON.stringify(selectedProducts, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    });
  };

  const handleProductNameClick = (token) => {
    router.push(`/product/${token}`);
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      // Deselect all
      setSelectedProducts([]);
    } else {
      // Select all
      setSelectedProducts(products.map(p => p.token));
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-white">
          Products Overview
        </h1>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <div className="hidden sm:flex items-center gap-2 justify-between">
            {products.length > 0 && (
               <button
                onClick={handleSelectAll}
                className="bg-neutral-700 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
              >
                {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            {selectedProducts.length > 0 && (
              <>
                <span className="text-neutral-400 text-sm">
                  {selectedProducts.length} selected
                </span>
                <button
                  onClick={handleCopyToClipboard}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
                >
                  {copyStatus || "Copy Tokens"}
                </button>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 rounded-lg p-1 bg-neutral-800">
            <button
              onClick={() => setView("grid")}
              className={`flex items-center justify-center w-full sm:w-auto px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                view === "grid"
                  ? "bg-cyan-600 text-white"
                  : "text-neutral-300 hover:bg-neutral-700"
              }`}
              aria-label="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center justify-center w-full sm:w-auto px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                view === "list"
                  ? "bg-cyan-600 text-white"
                  : "text-neutral-300 hover:bg-neutral-700"
              }`}
              aria-label="List view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>
      <div
        className={`grid gap-6 ${
          view === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            : "grid-cols-1"
        }`}
      >
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            isSelected={selectedProducts.includes(product.token)}
            onSelect={handleSelectProduct}
            view={view}
            onProductNameClick={handleProductNameClick}
          />
        ))}
      </div>
    </>
  );
}