"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

// Export presets configuration
const EXPORT_PRESETS = {
  shopify: {
    name: "Shopify",
    description: "Standard Shopify product import format",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 109.5 124.5" fill="currentColor">
        <path d="M95.9 23.9c-.1-.6-.6-1-1.1-1-.5 0-9.3-.2-9.3-.2s-7.4-7.2-8.1-7.9c-.7-.7-2.2-.5-2.7-.3 0 0-1.4.4-3.7 1.1-.4-1.3-1-2.8-1.8-4.4-2.6-5-6.5-7.7-11.1-7.7-.3 0-.6 0-1 .1-.1-.2-.3-.3-.4-.5-2-2.2-4.6-3.2-7.7-3.1-6 .2-12 4.5-16.8 12.2-3.4 5.4-6 12.2-6.7 17.5-6.9 2.1-11.7 3.6-11.8 3.7-3.5 1.1-3.6 1.2-4 4.5-.3 2.5-9.5 73.1-9.5 73.1l75.6 13.1 32.6-8.1S96 24.4 95.9 23.9zM67.2 16.8l-5.9 1.8c0-3-.4-7.3-1.8-10.9 4.5.9 6.7 5.9 7.7 9.1zm-10 3.1l-12.7 3.9c1.2-4.7 3.6-9.4 6.4-12.5 1.1-1.1 2.6-2.4 4.3-3.1 1.7 3.5 2.1 8.4 2 11.7zm-8-14.9c1.4 0 2.6.3 3.6.9-1.6.8-3.2 2.1-4.7 3.6-3.8 4.1-6.7 10.5-7.9 16.6l-10.4 3.2c2-9.8 9.9-23.6 19.4-24.3z"/>
        <path d="M94.8 22.9c-.5 0-9.3-.2-9.3-.2s-7.4-7.2-8.1-7.9c-.3-.3-.6-.4-1-.4l-4.8 97.3 32.6-8.1s-8.2-55.8-8.3-56.5c-.1-.6-.6-1.1-1.1-1.2z" fill="currentColor" opacity="0.15"/>
        <path d="M56.1 39.9l-4.3 12.9s-4.8-2.5-10.6-2.1c-8.5.6-8.6 5.9-8.5 7.2.5 6.9 18.6 8.4 19.6 24.6.8 12.7-6.7 21.4-17.6 22.1-13.1.8-20.3-6.9-20.3-6.9l2.8-11.8s7.3 5.5 13.1 5.1c3.8-.2 5.2-3.4 5-5.6-.6-9-15.4-8.5-16.3-23.3-.8-12.4 7.4-25 25.4-26.1 6.9-.5 10.7 1.9 10.7 1.9z" fill="#fff"/>
      </svg>
    ),
    fields: [
      { key: "handle", label: "Handle", default: true },
      { key: "title", label: "Title", default: true },
      { key: "body_html", label: "Body (HTML)", default: true },
      { key: "vendor", label: "Vendor", default: true },
      { key: "type", label: "Type", default: false },
      { key: "tags", label: "Tags (Categories)", default: true },
      { key: "ai_tags", label: "Tags (AI Categories)", default: false },
      { key: "published", label: "Published", default: true },
      { key: "variant_sku", label: "Variant SKU", default: true },
      { key: "variant_title", label: "Variant Title", default: true },
      { key: "variant_price", label: "Variant Price", default: true },
      { key: "variant_compare_at_price", label: "Compare At Price", default: false },
      { key: "variant_inventory_qty", label: "Inventory Qty", default: true },
      { key: "variant_barcode", label: "Barcode", default: true },
      { key: "image_src", label: "Image Src", default: true },
      { key: "image_alt_text", label: "Image Alt Text", default: false },
      { key: "variant_image", label: "Variant Image", default: false },
    ],
  },
  simple: {
    name: "Simple",
    description: "Basic product list",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    fields: [
      { key: "product_name", label: "Product Name", default: true },
      { key: "variant_name", label: "Variant Name", default: true },
      { key: "sku", label: "SKU", default: true },
      { key: "ean", label: "EAN", default: true },
      { key: "price", label: "Price", default: true },
      { key: "vat", label: "VAT %", default: true },
      { key: "price_with_vat", label: "Price with VAT", default: false },
      { key: "stock", label: "Stock", default: true },
      { key: "categories", label: "Categories", default: true },
      { key: "ai_category_names", label: "AI Categories", default: false },
      { key: "image_url", label: "Image URL", default: true },
    ],
  },
  detailed: {
    name: "Detailed",
    description: "Full product data with metadata",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    fields: [
      { key: "product_token", label: "Product Token", default: true },
      { key: "product_code", label: "Product Code", default: true },
      { key: "product_name", label: "Product Name", default: true },
      { key: "variant_token", label: "Variant Token", default: true },
      { key: "variant_code", label: "Variant Code", default: true },
      { key: "variant_name", label: "Variant Name", default: true },
      { key: "ean", label: "EAN Code", default: true },
      { key: "price", label: "Price", default: true },
      { key: "pricelist_name", label: "Pricelist Name", default: true },
      { key: "vat", label: "VAT %", default: true },
      { key: "price_with_vat", label: "Price with VAT", default: false },
      { key: "stock", label: "Stock Amount", default: true },
      { key: "categories", label: "Categories", default: true },
      { key: "ai_export_ids", label: "AI Export IDs", default: false },
      { key: "ai_category_names", label: "AI Category Names", default: false },
      { key: "ai_category_ids", label: "AI Category IDs", default: false },
      { key: "ai_category_full", label: "AI Categories (Full)", default: false },
      { key: "short_description", label: "Short Description", default: false },
      { key: "detailed_description", label: "Detailed Description", default: false },
      { key: "is_new", label: "New Product", default: true },
      { key: "is_recommended", label: "Recommended", default: true },
      { key: "is_published", label: "Published", default: false },
      { key: "is_active", label: "Active", default: false },
      { key: "product_images", label: "Product Images", default: true },
      { key: "variant_images", label: "Variant Images", default: true },
      { key: "all_images", label: "All Images", default: false },
      { key: "created_at", label: "Created At", default: false },
      { key: "updated_at", label: "Updated At", default: false },
    ],
  },
  inventory: {
    name: "Inventory",
    description: "Stock levels and pricing",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    fields: [
      { key: "sku", label: "SKU", default: true },
      { key: "ean", label: "EAN", default: true },
      { key: "product_name", label: "Product Name", default: true },
      { key: "variant_name", label: "Variant Name", default: true },
      { key: "stock", label: "Stock Qty", default: true },
      { key: "price", label: "Price", default: true },
      { key: "pricelist_name", label: "Pricelist", default: true },
      { key: "vat", label: "VAT %", default: true },
      { key: "price_with_vat", label: "Price with VAT", default: true },
      { key: "stock_value", label: "Stock Value", default: true },
      { key: "in_stock", label: "In Stock", default: true },
    ],
  },
};

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// Icons
const ChevronUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function ExportPage({ initialProducts = [], apiUrl = "http://localhost:4000" }) {
  // State
  const [selectedPreset, setSelectedPreset] = useState("shopify");
  const [selectedFields, setSelectedFields] = useState(() => {
    const preset = EXPORT_PRESETS.shopify;
    return preset.fields.filter((f) => f.default).map((f) => f.key);
  });
  const [filters, setFilters] = useState({
    search: "",
    stockStatus: "all",
    minPrice: "",
    maxPrice: "",
    category: "all",
    aiExportId: "all",
    aiCategory: "all",
    showNew: false,
    showRecommended: false,
    publishedOnly: false,
  });
  const [pricelistPriority, setPricelistPriority] = useState([]);
  const [exportStatus, setExportStatus] = useState("");
  const [activeTab, setActiveTab] = useState("configure"); // configure, saved
  const [savedExports, setSavedExports] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [exportName, setExportName] = useState("");
  const [exportDescription, setExportDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExports, setIsLoadingExports] = useState(false);
  const [previewLimit, setPreviewLimit] = useState(5);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null); // index where indicator shows
  const [copiedId, setCopiedId] = useState(null); // track which export link was copied
  const [downloadingId, setDownloadingId] = useState(null); // track which export is downloading

  // Extract all unique pricelists from products
  const availablePricelists = useMemo(() => {
    const pricelistMap = new Map();
    initialProducts.forEach((product) => {
      product.child_products?.forEach((variant) => {
        variant.pricelist?.forEach((pl) => {
          if (pl.name && !pricelistMap.has(pl.name)) {
            pricelistMap.set(pl.name, {
              name: pl.name,
              validFrom: pl.valid_from,
            });
          }
        });
      });
    });
    return Array.from(pricelistMap.values()).sort((a, b) =>
      new Date(b.validFrom) - new Date(a.validFrom)
    );
  }, [initialProducts]);

  // Initialize pricelist priority when available
  useEffect(() => {
    if (availablePricelists.length > 0 && pricelistPriority.length === 0) {
      setPricelistPriority(
        availablePricelists.map((pl, idx) => ({
          name: pl.name,
          enabled: true,
          priority: idx,
        }))
      );
    }
  }, [availablePricelists, pricelistPriority.length]);

  // Extract all unique categories
  const availableCategories = useMemo(() => {
    const categories = new Set();
    initialProducts.forEach((product) => {
      product.categories?.forEach((cat) => categories.add(cat));
    });
    return Array.from(categories).sort();
  }, [initialProducts]);

  // Extract all unique AI exports
  const availableAiExports = useMemo(() => {
    const exportMap = new Map();
    initialProducts.forEach((product) => {
      product.ai_categories?.forEach((cat) => {
        if (cat.exportId && !exportMap.has(cat.exportId)) {
          exportMap.set(cat.exportId, {
            exportId: cat.exportId,
            name: cat.categoryName?.split(" / ")[0] || cat.exportId.slice(-6),
          });
        }
      });
    });
    return Array.from(exportMap.values());
  }, [initialProducts]);

  // Extract AI categories filtered by selected exportId
  const availableAiCategories = useMemo(() => {
    const categoryMap = new Map();
    initialProducts.forEach((product) => {
      product.ai_categories?.forEach((cat) => {
        if (filters.aiExportId !== "all" && cat.exportId !== filters.aiExportId) {
          return;
        }
        if (cat.categoryId && cat.categoryName && !categoryMap.has(cat.categoryId)) {
          categoryMap.set(cat.categoryId, {
            exportId: cat.exportId,
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
          });
        }
      });
    });
    return Array.from(categoryMap.values()).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName)
    );
  }, [initialProducts, filters.aiExportId]);

  // Get price from pricelist priority (first enabled pricelist that has a price)
  const getPriceFromPriority = useCallback((variant) => {
    if (!variant?.pricelist || variant.pricelist.length === 0) {
      return { price: 0, vat: 0, name: "" };
    }

    const enabledPricelists = pricelistPriority
      .filter((p) => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const pl of enabledPricelists) {
      const found = variant.pricelist.find((p) => p.name === pl.name);
      if (found && found.price !== undefined) {
        return { price: found.price || 0, vat: found.vat || 0, name: found.name };
      }
    }

    // Fallback to first available
    const first = variant.pricelist[0];
    return { price: first.price || 0, vat: first.vat || 0, name: first.name || "" };
  }, [pricelistPriority]);

  // Filter products based on criteria
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = product.product_name?.toLowerCase().includes(searchLower);
        const codeMatch = product.code?.toLowerCase().includes(searchLower);
        const descMatch = product.short_description?.toLowerCase().includes(searchLower);
        const skuMatch = product.child_products?.some(
          (v) => v.code?.toLowerCase().includes(searchLower) ||
                 v.ean_code?.toLowerCase().includes(searchLower)
        );
        if (!nameMatch && !codeMatch && !descMatch && !skuMatch) return false;
      }

      if (filters.stockStatus !== "all") {
        const hasStock = product.child_products?.some((v) => v.stock_amount > 0);
        if (filters.stockStatus === "in_stock" && !hasStock) return false;
        if (filters.stockStatus === "out_of_stock" && hasStock) return false;
      }

      if (filters.minPrice || filters.maxPrice) {
        const prices = product.child_products?.map((v) => {
          const priceInfo = getPriceFromPriority(v);
          return priceInfo.price;
        }).filter((p) => p > 0) || [];

        if (prices.length === 0) return false;
        const minProductPrice = Math.min(...prices);
        const maxProductPrice = Math.max(...prices);

        if (filters.minPrice && maxProductPrice < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && minProductPrice > parseFloat(filters.maxPrice)) return false;
      }

      if (filters.category !== "all") {
        const hasCategory = product.categories?.includes(filters.category);
        if (!hasCategory) return false;
      }

      if (filters.aiExportId !== "all") {
        const hasExport = product.ai_categories?.some((c) => c.exportId === filters.aiExportId);
        if (!hasExport) return false;
      }

      if (filters.aiCategory !== "all") {
        const hasAiCategory = product.ai_categories?.some(
          (c) => c.categoryId === filters.aiCategory &&
                 (filters.aiExportId === "all" || c.exportId === filters.aiExportId)
        );
        if (!hasAiCategory) return false;
      }

      if (filters.showNew && !product.new) return false;
      if (filters.showRecommended && !product.recomended) return false;
      if (filters.publishedOnly && !product.published) return false;

      return true;
    });
  }, [initialProducts, filters, getPriceFromPriority]);

  // Handle preset change
  const handlePresetChange = (presetKey) => {
    setSelectedPreset(presetKey);
    const preset = EXPORT_PRESETS[presetKey];
    setSelectedFields(preset.fields.filter((f) => f.default).map((f) => f.key));
  };

  // Toggle field selection
  const toggleField = (fieldKey) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey)
        ? prev.filter((k) => k !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  // Move pricelist up/down
  const movePricelist = (index, direction) => {
    const newPriority = [...pricelistPriority];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newPriority.length) return;

    [newPriority[index], newPriority[newIndex]] = [newPriority[newIndex], newPriority[index]];
    newPriority.forEach((p, i) => (p.priority = i));
    setPricelistPriority(newPriority);
  };

  // Toggle pricelist enabled
  const togglePricelist = (index) => {
    const newPriority = [...pricelistPriority];
    newPriority[index].enabled = !newPriority[index].enabled;
    setPricelistPriority(newPriority);
  };

  // Simple drag and drop for pricelist
  const onDragStart = (index) => {
    setDraggedIndex(index);
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertAt = e.clientY < midY ? index : index + 1;

    setDropIndicator(insertAt);
  };

  const onDragEnd = () => {
    if (draggedIndex !== null && dropIndicator !== null) {
      const newList = [...pricelistPriority];
      const [removed] = newList.splice(draggedIndex, 1);
      const insertAt = dropIndicator > draggedIndex ? dropIndicator - 1 : dropIndicator;
      newList.splice(insertAt, 0, removed);
      newList.forEach((p, i) => (p.priority = i));
      setPricelistPriority(newList);
    }
    setDraggedIndex(null);
    setDropIndicator(null);
  };

  const onDragLeave = () => {
    setDropIndicator(null);
  };

  // Helper function to get field value
  const getFieldValue = (fieldKey, product, variant, rowIndex, imageParam, priceInfo, isImageOnlyRow, isShopify) => {
    const priceWithVat = priceInfo.vat > 0
      ? priceInfo.price * (1 + priceInfo.vat / 100)
      : priceInfo.price;

    if (isImageOnlyRow && isShopify) {
      if (fieldKey === "handle") return product.token || "";
      if (fieldKey === "image_src") return imageParam || "";
      if (fieldKey === "image_alt_text") return product.product_name || "";
      return "";
    }

    const isFirstRow = rowIndex === 0;

    switch (fieldKey) {
      case "handle":
        return product.token || "";
      case "title":
        return isShopify ? (isFirstRow ? (product.product_name || "") : "") : (product.product_name || "");
      case "body_html":
        return isShopify ? (isFirstRow ? (product.detailed_description || product.short_description || "") : "") : (product.detailed_description || product.short_description || "");
      case "vendor":
        return isShopify ? (isFirstRow ? "Patrik International" : "") : "Patrik International";
      case "type":
        return isShopify ? (isFirstRow ? (product.categories?.[0] || "") : "") : (product.categories?.[0] || "");
      case "tags":
        if (isShopify && !isFirstRow) return "";
        const tags = [
          ...(product.categories || []),
          product.new ? "new" : "",
          product.recomended ? "recommended" : "",
        ].filter(Boolean);
        return tags.join(", ");
      case "ai_tags":
        if (isShopify && !isFirstRow) return "";
        const filteredAiCats = filters.aiExportId !== "all"
          ? product.ai_categories?.filter((c) => c.exportId === filters.aiExportId)
          : product.ai_categories;
        return (filteredAiCats?.map((c) => c.categoryName) || []).join(", ");
      case "published":
        return isShopify ? (isFirstRow ? (product.published ? "TRUE" : "FALSE") : "") : (product.published ? "TRUE" : "FALSE");
      case "variant_sku":
        return variant?.code || "";
      case "variant_title":
        return variant?.product_name || "";
      case "variant_price":
        return variant ? priceInfo.price.toFixed(2) : "";
      case "variant_compare_at_price":
        if (!variant) return "";
        const enabledPricelists = pricelistPriority.filter((p) => p.enabled);
        if (enabledPricelists.length > 1) {
          const secondPricelist = enabledPricelists[1];
          const found = variant.pricelist?.find((p) => p.name === secondPricelist?.name);
          return found?.price?.toFixed(2) || "";
        }
        return "";
      case "variant_inventory_qty":
        return variant ? (variant.stock_amount || 0) : "";
      case "variant_barcode":
        return variant?.ean_code || "";
      case "image_src":
        return isShopify ? (imageParam || "") : (product.images?.[0] || "");
      case "image_alt_text":
        return product.product_name || "";
      case "variant_image":
        return variant?.images?.[0] || "";
      case "product_name":
        return product.product_name || "";
      case "variant_name":
        return variant?.product_name || "";
      case "sku":
      case "variant_code":
        return variant?.code || "";
      case "ean":
        return variant?.ean_code || "";
      case "price":
        return variant ? priceInfo.price.toFixed(2) : "";
      case "pricelist_name":
        return priceInfo.name || "";
      case "vat":
        return variant ? priceInfo.vat : "";
      case "price_with_vat":
        return variant ? priceWithVat.toFixed(2) : "";
      case "stock":
        return variant ? (variant.stock_amount || 0) : "";
      case "stock_value":
        return variant ? ((variant.stock_amount || 0) * priceInfo.price).toFixed(2) : "";
      case "in_stock":
        return variant ? ((variant.stock_amount || 0) > 0 ? "Yes" : "No") : "";
      case "categories":
        return (product.categories || []).join("; ");
      case "ai_export_ids":
        const exportIds = [...new Set(product.ai_categories?.map((c) => c.exportId) || [])];
        return exportIds.join("; ");
      case "ai_category_names":
        const filteredCatsNames = filters.aiExportId !== "all"
          ? product.ai_categories?.filter((c) => c.exportId === filters.aiExportId)
          : product.ai_categories;
        return (filteredCatsNames?.map((c) => c.categoryName) || []).join("; ");
      case "ai_category_ids":
        const filteredCatsIds = filters.aiExportId !== "all"
          ? product.ai_categories?.filter((c) => c.exportId === filters.aiExportId)
          : product.ai_categories;
        return (filteredCatsIds?.map((c) => c.categoryId) || []).join("; ");
      case "ai_category_full":
        const filteredCatsFull = filters.aiExportId !== "all"
          ? product.ai_categories?.filter((c) => c.exportId === filters.aiExportId)
          : product.ai_categories;
        return (filteredCatsFull?.map((c) => `${c.categoryName} [${c.categoryId}]`) || []).join("; ");
      case "image_url":
        return variant?.images?.[0] || product.images?.[0] || "";
      case "product_token":
        return product.token || "";
      case "product_code":
        return product.code || "";
      case "variant_token":
        return variant?.token || "";
      case "short_description":
        return stripHtml(product.short_description || "");
      case "detailed_description":
        return stripHtml(product.detailed_description || "");
      case "is_new":
        return product.new ? "Yes" : "No";
      case "is_recommended":
        return product.recomended ? "Yes" : "No";
      case "is_published":
        return product.published ? "Yes" : "No";
      case "is_active":
        return product.active ? "Yes" : "No";
      case "product_images":
        return (product.images || []).join("; ");
      case "variant_images":
        return (variant?.images || []).join("; ");
      case "all_images":
        return [...(product.images || []), ...(variant?.images || [])].join("; ");
      case "created_at":
        return formatDate(product.createdAt);
      case "updated_at":
        return formatDate(product.updatedAt);
      default:
        return "";
    }
  };

  // Generate CSV data
  const generateCSVData = useCallback(() => {
    const preset = EXPORT_PRESETS[selectedPreset];
    const rows = [];
    const isShopify = selectedPreset === "shopify";

    const headers = preset.fields
      .filter((f) => selectedFields.includes(f.key))
      .map((f) => f.label);
    rows.push(headers.map(escapeCSV).join(","));

    filteredProducts.forEach((product) => {
      const variants = product.child_products || [];
      const productImages = product.images || [];

      const allImages = [
        ...productImages,
        ...variants.flatMap((v) => v.images || [])
      ];
      const uniqueImages = [...new Set(allImages)];

      if (isShopify) {
        const numVariants = Math.max(variants.length, 1);
        const numImages = uniqueImages.length;
        const maxRows = Math.max(numVariants, numImages);

        for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
          const row = [];
          const hasVariant = rowIdx < variants.length;
          const variant = hasVariant ? variants[rowIdx] : null;
          const isImageOnlyRow = !hasVariant && rowIdx < numImages;
          const currentImage = uniqueImages[rowIdx] || "";
          const priceInfo = variant ? getPriceFromPriority(variant) : { price: 0, vat: 0, name: "" };

          preset.fields.forEach((field) => {
            if (!selectedFields.includes(field.key)) return;
            const value = getFieldValue(field.key, product, variant, rowIdx, currentImage, priceInfo, isImageOnlyRow, true);
            row.push(escapeCSV(value));
          });

          rows.push(row.join(","));
        }
      } else {
        const variantsToExport = variants.length > 0 ? variants : [null];

        variantsToExport.forEach((variant, variantIndex) => {
          const row = [];
          const priceInfo = variant ? getPriceFromPriority(variant) : { price: 0, vat: 0, name: "" };

          preset.fields.forEach((field) => {
            if (!selectedFields.includes(field.key)) return;
            const value = getFieldValue(field.key, product, variant, variantIndex, "", priceInfo, false, false);
            row.push(escapeCSV(value));
          });

          rows.push(row.join(","));
        });
      }
    });

    return rows.join("\n");
  }, [selectedPreset, selectedFields, filteredProducts, getPriceFromPriority, filters.aiExportId, pricelistPriority]);

  // Download CSV
  const handleDownload = () => {
    if (filteredProducts.length === 0) {
      setExportStatus("No products to export");
      setTimeout(() => setExportStatus(""), 3000);
      return;
    }

    const csvData = generateCSVData();
    const blob = new Blob(["\ufeff" + csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `patrik-export-${selectedPreset}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportStatus("Downloaded!");
    setTimeout(() => setExportStatus(""), 3000);
  };

  // Save export configuration - POST {EXPORT_API_URL}/custom-export
  const handleSaveExport = async () => {
    if (!exportName.trim()) {
      setExportStatus("Please enter a name");
      return;
    }

    setIsSaving(true);
    try {
      const exportConfig = {
        name: exportName.trim(),
        description: exportDescription.trim() || null,
        preset: selectedPreset,
        selectedFields,
        filters,
        pricelistPriority,
      };

      const response = await fetch(`${apiUrl}/custom-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportConfig),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error codes from API
        if (result.code === "DUPLICATE_NAME") {
          setExportStatus("Export with this name already exists");
        } else if (result.code === "VALIDATION_ERROR") {
          setExportStatus(result.error || "Validation failed");
        } else {
          setExportStatus(result.error || "Failed to save export");
        }
        setTimeout(() => setExportStatus(""), 4000);
        return;
      }

      setSavedExports((prev) => [result.data, ...prev]);
      setShowSaveModal(false);
      setExportName("");
      setExportDescription("");
      setExportStatus("Export saved!");
      setTimeout(() => setExportStatus(""), 3000);
    } catch (error) {
      console.error("Save export error:", error);
      setExportStatus("Failed to connect to server");
      setTimeout(() => setExportStatus(""), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved exports - GET {EXPORT_API_URL}/custom-export
  const loadSavedExports = async () => {
    setIsLoadingExports(true);
    try {
        console.log(apiUrl)
      const response = await fetch(`${apiUrl}/custom-export`);

      if (!response.ok) {
        console.error("Failed to load exports:", response.status);
        return;
      }

      const result = await response.json();
      setSavedExports(result.data || []);
    } catch (error) {
      console.error("Load exports error:", error);
      setExportStatus("Failed to load saved exports");
      setTimeout(() => setExportStatus(""), 3000);
    } finally {
      setIsLoadingExports(false);
    }
  };

  // Load export config into UI
  const loadExportConfig = (config) => {
    // Set preset first (determines available fields)
    setSelectedPreset(config.preset);

    // Set selected fields
    setSelectedFields(config.selectedFields || []);

    // Set filters with defaults
    setFilters({
      search: "",
      stockStatus: "all",
      minPrice: "",
      maxPrice: "",
      category: "all",
      aiExportId: "all",
      aiCategory: "all",
      showNew: false,
      showRecommended: false,
      publishedOnly: false,
      ...config.filters,
    });

    // Set pricelist priority if available
    if (config.pricelistPriority?.length > 0) {
      setPricelistPriority(config.pricelistPriority);
    }

    setActiveTab("configure");
    setExportStatus("Configuration loaded!");
    setTimeout(() => setExportStatus(""), 3000);
  };

  // Delete export - DELETE {EXPORT_API_URL}/custom-export/:id
  const deleteExport = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/custom-export/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        setExportStatus(result.error || "Failed to delete");
        setTimeout(() => setExportStatus(""), 3000);
        return;
      }

      setSavedExports((prev) => prev.filter((e) => e._id !== id));
      setExportStatus("Export deleted");
      setTimeout(() => setExportStatus(""), 2000);
    } catch (error) {
      console.error("Delete export error:", error);
      setExportStatus("Failed to delete export");
      setTimeout(() => setExportStatus(""), 3000);
    }
  };

  // Download CSV directly from API - GET {EXPORT_API_URL}/custom-export/:id/csv
  const downloadFromAPI = async (configId) => {
    setDownloadingId(configId);
    try {
      const response = await fetch(`${apiUrl}/custom-export/${configId}/csv`);

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `patrik_products_${configId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      setExportStatus("Download failed");
      setTimeout(() => setExportStatus(""), 3000);
    } finally {
      setDownloadingId(null);
    }
  };

  // Copy export link to clipboard
  const copyExportLink = async (configId) => {
    const exportUrl = `${apiUrl}/custom-export/${configId}/csv`;
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopiedId(configId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      setExportStatus("Failed to copy link");
      setTimeout(() => setExportStatus(""), 2000);
    }
  };

  // Load exports on tab change
  useEffect(() => {
    if (activeTab === "saved") {
      loadSavedExports();
    }
  }, [activeTab]);

  // Count total rows
  const totalRows = useMemo(() => {
    const isShopify = selectedPreset === "shopify";
    return filteredProducts.reduce((sum, p) => {
      const numVariants = Math.max(p.child_products?.length || 0, 1);
      if (isShopify) {
        const allImages = [
          ...(p.images || []),
          ...(p.child_products || []).flatMap((v) => v.images || [])
        ];
        const numUniqueImages = new Set(allImages).size;
        return sum + Math.max(numVariants, numUniqueImages);
      }
      return sum + numVariants;
    }, 0);
  }, [filteredProducts, selectedPreset]);

  const currentPreset = EXPORT_PRESETS[selectedPreset];

  const clearFilters = () => {
    setFilters({
      search: "",
      stockStatus: "all",
      minPrice: "",
      maxPrice: "",
      category: "all",
      aiExportId: "all",
      aiCategory: "all",
      showNew: false,
      showRecommended: false,
      publishedOnly: false,
    });
    setPreviewLimit(5);
  };

  // Reset preview limit when filters change
  useEffect(() => {
    setPreviewLimit(5);
  }, [filters]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-6">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Product Export
              </h1>
              <p className="text-neutral-400 mt-1">
                Create and manage custom CSV exports
              </p>
            </div>

            {/* Action Buttons */}
            {activeTab === "configure" && (
              <div className="flex items-center gap-3">
                {exportStatus && (
                  <span className={`text-sm font-medium ${exportStatus.includes("!") ? "text-green-400" : "text-amber-400"}`}>
                    {exportStatus}
                  </span>
                )}
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={selectedFields.length === 0}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 rounded-xl transition-all"
                >
                  <SaveIcon />
                  Save Export
                </button>
                <button
                  onClick={handleDownload}
                  disabled={selectedFields.length === 0 || filteredProducts.length === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-neutral-600 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:shadow-none"
                >
                  <DownloadIcon />
                  Download CSV
                </button>
              </div>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-neutral-800/50 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab("configure")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "configure"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configure Export
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "saved"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Saved Exports
              {savedExports.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-neutral-700 text-neutral-300">
                  {savedExports.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeTab === "configure" ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Preset Cards */}
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-5 border border-neutral-700/50">
              <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4">
                Export Format
              </h2>
              <div className="space-y-2">
                {Object.entries(EXPORT_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      selectedPreset === key
                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-white"
                        : "bg-neutral-800/50 border border-transparent text-neutral-400 hover:bg-neutral-700/50 hover:text-white"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedPreset === key ? "bg-cyan-500/20" : "bg-neutral-700/50"}`}>
                      {preset.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-neutral-500">{preset.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pricelist Priority */}
            {pricelistPriority.length > 0 && (
              <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-700/50">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    <h2 className="text-sm font-semibold text-white">Pricelist Priority</h2>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1.5">
                    Drag to reorder • First enabled pricelist wins
                  </p>
                </div>

                {/* Draggable List */}
                <div className="p-3">
                  {/* Drop indicator at top */}
                  {dropIndicator === 0 && draggedIndex !== 0 && (
                    <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-2 shadow-lg shadow-cyan-500/50 animate-pulse" />
                  )}

                  {pricelistPriority.map((pl, idx) => (
                    <div key={pl.name}>
                      <div
                        draggable
                        onDragStart={() => onDragStart(idx)}
                        onDragOver={(e) => onDragOver(e, idx)}
                        onDragEnd={onDragEnd}
                        onDragLeave={onDragLeave}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl mb-2 last:mb-0
                          transition-all duration-150 ease-out
                          cursor-grab active:cursor-grabbing select-none
                          ${draggedIndex === idx
                            ? "opacity-50 scale-95 bg-neutral-900/50 border-2 border-dashed border-cyan-500/50"
                            : pl.enabled
                            ? "bg-neutral-800/60 border border-neutral-700/50 hover:border-cyan-500/30 hover:bg-neutral-800/80"
                            : "bg-neutral-900/40 border border-neutral-800/50 opacity-50"
                          }
                          group
                        `}
                      >
                        {/* Drag Handle */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-700/30 text-neutral-500 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="9" cy="6" r="1.5" />
                            <circle cx="15" cy="6" r="1.5" />
                            <circle cx="9" cy="12" r="1.5" />
                            <circle cx="15" cy="12" r="1.5" />
                            <circle cx="9" cy="18" r="1.5" />
                            <circle cx="15" cy="18" r="1.5" />
                          </svg>
                        </div>

                        {/* Priority Badge */}
                        <div className={`
                          flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition-all
                          ${idx === 0 && pl.enabled
                            ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                            : pl.enabled
                            ? "bg-neutral-700/80 text-neutral-300"
                            : "bg-neutral-800 text-neutral-500"
                          }
                        `}>
                          {idx + 1}
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {pl.name}
                          </div>
                          {idx === 0 && pl.enabled && (
                            <div className="text-[10px] text-amber-400/80 font-medium uppercase tracking-wider mt-0.5">
                              Primary
                            </div>
                          )}
                        </div>

                        {/* Toggle */}
                        <label
                          className="relative inline-flex items-center cursor-pointer shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={pl.enabled}
                            onChange={() => togglePricelist(idx)}
                            className="sr-only peer"
                          />
                          <div className={`
                            w-10 h-6 rounded-full transition-all duration-200
                            after:content-[''] after:absolute after:top-[3px] after:left-[3px]
                            after:bg-white after:rounded-full after:h-[18px] after:w-[18px]
                            after:transition-all after:duration-200 after:shadow-sm
                            peer-checked:after:translate-x-[16px]
                            ${pl.enabled
                              ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                              : "bg-neutral-700"
                            }
                          `} />
                        </label>
                      </div>

                      {/* Drop indicator after this item */}
                      {dropIndicator === idx + 1 && draggedIndex !== idx && draggedIndex !== idx + 1 && (
                        <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-2 shadow-lg shadow-cyan-500/50 animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer hint */}
                {pricelistPriority.filter(p => p.enabled).length === 0 && (
                  <div className="px-5 py-3 bg-amber-500/10 border-t border-amber-500/20">
                    <p className="text-xs text-amber-400">
                      Enable at least one pricelist to export prices
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-700/50">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <h2 className="text-sm font-semibold text-white">Filters</h2>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    placeholder="Search name, SKU, EAN..."
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                  />
                </div>

                {/* Categories Section */}
                {(availableCategories.length > 0 || availableAiExports.length > 0) && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Categories</div>

                    {availableCategories.length > 0 && (
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1rem" }}
                      >
                        <option value="all">All Categories</option>
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}

                    {availableAiExports.length > 0 && (
                      <select
                        value={filters.aiExportId}
                        onChange={(e) => setFilters((prev) => ({ ...prev, aiExportId: e.target.value, aiCategory: "all" }))}
                        className="w-full px-3 py-2.5 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1rem" }}
                      >
                        <option value="all">All AI Exports</option>
                        {availableAiExports.map((exp) => (
                          <option key={exp.exportId} value={exp.exportId}>{exp.name}</option>
                        ))}
                      </select>
                    )}

                    {availableAiCategories.length > 0 && (
                      <select
                        value={filters.aiCategory}
                        onChange={(e) => setFilters((prev) => ({ ...prev, aiCategory: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1rem" }}
                      >
                        <option value="all">All AI Categories</option>
                        {availableAiCategories.map((cat) => (
                          <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Stock & Pricing Section */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Stock & Pricing</div>

                  {/* Stock Status Pills */}
                  <div className="flex gap-2">
                    {[
                      { value: "all", label: "All" },
                      { value: "in_stock", label: "In Stock" },
                      { value: "out_of_stock", label: "Out" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setFilters((prev) => ({ ...prev, stockStatus: value }))}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          filters.stockStatus === value
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                            : "bg-neutral-800/50 text-neutral-400 border border-neutral-700/50 hover:border-neutral-600 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Price Range */}
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">EUR</span>
                      <input
                        type="number"
                        value={filters.minPrice}
                        onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                        placeholder="Min"
                        className="w-full pl-10 pr-3 py-2 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                    </div>
                    <span className="text-neutral-600">—</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Quick Filters</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "showNew", label: "New", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
                      { key: "showRecommended", label: "Recommended", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
                      { key: "publishedOnly", label: "Published", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
                    ].map(({ key, label, icon }) => (
                      <button
                        key={key}
                        onClick={() => setFilters((prev) => ({ ...prev, [key]: !prev[key] }))}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                          filters[key]
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                            : "bg-neutral-800/50 text-neutral-400 border border-neutral-700/50 hover:border-neutral-600 hover:text-white"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                        </svg>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-4 border border-neutral-700/50">
                <div className="text-2xl font-bold text-cyan-400">{filteredProducts.length}</div>
                <div className="text-xs text-neutral-500 mt-1">Products</div>
              </div>
              <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-4 border border-neutral-700/50">
                <div className="text-2xl font-bold text-blue-400">{totalRows}</div>
                <div className="text-xs text-neutral-500 mt-1">CSV Rows</div>
              </div>
              <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-4 border border-neutral-700/50">
                <div className="text-2xl font-bold text-purple-400">{selectedFields.length}</div>
                <div className="text-xs text-neutral-500 mt-1">Fields</div>
              </div>
              <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-4 border border-neutral-700/50">
                <div className="text-2xl font-bold text-pink-400">{currentPreset.name}</div>
                <div className="text-xs text-neutral-500 mt-1">Format</div>
              </div>
            </div>

            {/* Field Selection */}
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Select Fields</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedFields(currentPreset.fields.map((f) => f.key))}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setSelectedFields([])}
                    className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {currentPreset.fields.map((field) => (
                  <button
                    key={field.key}
                    onClick={() => toggleField(field.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                      selectedFields.includes(field.key)
                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-white"
                        : "bg-neutral-800/50 border border-neutral-700/30 text-neutral-400 hover:text-white hover:border-neutral-600"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                      selectedFields.includes(field.key) ? "bg-cyan-500" : "bg-neutral-700"
                    }`}>
                      {selectedFields.includes(field.key) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate">{field.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
              <div className="overflow-x-auto rounded-xl border border-neutral-700/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-800/80">
                      {currentPreset.fields
                        .filter((f) => selectedFields.includes(f.key))
                        .slice(0, 5)
                        .map((field) => (
                          <th key={field.key} className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                            {field.label}
                          </th>
                        ))}
                      {selectedFields.length > 5 && (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">
                          +{selectedFields.length - 5} more
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-700/50">
                    {filteredProducts.slice(0, previewLimit).map((product, idx) => {
                      const variant = product.child_products?.[0] || {};
                      const priceInfo = getPriceFromPriority(variant);
                      return (
                        <tr key={product._id || idx} className="hover:bg-neutral-700/20">
                          {currentPreset.fields
                            .filter((f) => selectedFields.includes(f.key))
                            .slice(0, 5)
                            .map((field) => {
                              let value = getFieldValue(field.key, product, variant, 0, product.images?.[0] || "", priceInfo, false, false);
                              if (typeof value === "number") value = value.toString();
                              if (value && value.length > 30) value = value.slice(0, 30) + "...";
                              return (
                                <td key={field.key} className="px-4 py-3 text-neutral-300 whitespace-nowrap">
                                  {value || <span className="text-neutral-600">—</span>}
                                </td>
                              );
                            })}
                          {selectedFields.length > 5 && (
                            <td className="px-4 py-3 text-neutral-600">...</td>
                          )}
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={Math.min(selectedFields.length, 6) || 1} className="px-4 py-12 text-center text-neutral-500">
                          No products match your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length > previewLimit && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-neutral-500">
                    Showing {Math.min(previewLimit, filteredProducts.length)} of {filteredProducts.length} products
                  </p>
                  <button
                    onClick={() => setPreviewLimit((prev) => prev + 10)}
                    className="flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Load more
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
              {filteredProducts.length > 0 && filteredProducts.length <= previewLimit && (
                <p className="text-sm text-neutral-500 mt-3">
                  Showing all {filteredProducts.length} products
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Saved Exports Tab */
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Saved Export Configurations</h2>
              <p className="text-sm text-neutral-400 mt-1">Load or download your saved export presets</p>
            </div>
            <div className="flex items-center gap-3">
              {exportStatus && (
                <span className={`text-sm font-medium ${exportStatus.includes("!") ? "text-green-400" : "text-amber-400"}`}>
                  {exportStatus}
                </span>
              )}
              <button
                onClick={loadSavedExports}
                disabled={isLoadingExports}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 hover:text-white rounded-xl text-sm font-medium transition-all border border-neutral-700/50"
              >
                <RefreshIcon />
                {isLoadingExports ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {isLoadingExports ? (
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 p-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-neutral-400">Loading saved exports...</p>
              </div>
            </div>
          ) : savedExports.length === 0 ? (
            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 p-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-neutral-800 rounded-2xl flex items-center justify-center border border-neutral-700/50">
                  <svg className="w-10 h-10 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-white mb-2">No saved exports yet</p>
                <p className="text-neutral-500 max-w-sm mb-6">Configure an export with your preferred settings, then save it for quick access later.</p>
                <button
                  onClick={() => setActiveTab("configure")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/25"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Export
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedExports.map((config) => (
                <div
                  key={config._id}
                  className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm border border-neutral-700/50 rounded-2xl overflow-hidden hover:border-neutral-600 transition-all group"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-neutral-700/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{config.name}</h3>
                        {config.description && (
                          <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{config.description}</p>
                        )}
                      </div>
                      <div className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        config.preset === "shopify" ? "bg-green-500/20 text-green-400" :
                        config.preset === "simple" ? "bg-blue-500/20 text-blue-400" :
                        config.preset === "detailed" ? "bg-purple-500/20 text-purple-400" :
                        "bg-orange-500/20 text-orange-400"
                      }`}>
                        {EXPORT_PRESETS[config.preset]?.name || config.preset}
                      </div>
                    </div>
                  </div>

                  {/* Card Meta */}
                  <div className="px-5 py-3 bg-neutral-900/30">
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {config.selectedFields?.length || 0} fields
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(config.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 flex gap-2">
                    <button
                      onClick={() => loadExportConfig(config)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Load
                    </button>
                    <button
                      onClick={() => copyExportLink(config._id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                        copiedId === config._id
                          ? "bg-green-500/20 text-green-400"
                          : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                      }`}
                      title="Copy export link"
                    >
                      {copiedId === config._id ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <LinkIcon />
                          Get Link
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => downloadFromAPI(config._id)}
                      disabled={downloadingId === config._id}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                        downloadingId === config._id
                          ? "bg-neutral-700/50 text-neutral-400 cursor-wait"
                          : "bg-neutral-700/50 hover:bg-neutral-600/50 text-white"
                      }`}
                    >
                      {downloadingId === config._id ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <DownloadIcon />
                          Download
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteExport(config._id)}
                      className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                      title="Delete export"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-2xl p-6 w-full max-w-md border border-neutral-700">
            <h3 className="text-xl font-semibold text-white mb-4">Save Export Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Export Name *
                </label>
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  placeholder="My Shopify Export"
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={exportDescription}
                  onChange={(e) => setExportDescription(e.target.value)}
                  placeholder="Weekly export for online store"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                />
              </div>
              <div className="bg-neutral-900/50 rounded-xl p-4">
                <div className="text-xs text-neutral-400 space-y-1">
                  <div>Format: <span className="text-white">{currentPreset.name}</span></div>
                  <div>Fields: <span className="text-white">{selectedFields.length}</span></div>
                  <div>Products: <span className="text-white">{filteredProducts.length}</span></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 px-4 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExport}
                disabled={isSaving || !exportName.trim()}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-neutral-600 disabled:to-neutral-700 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Export"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
