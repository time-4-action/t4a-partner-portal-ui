/**
 * Export Page Component
 *
 * Advanced product export system with multiple format presets and configuration options.
 *
 * Features:
 * - Multiple export presets (Shopify, Simple, Detailed, Inventory)
 * - Field selection and customization
 * - Advanced filtering (stock status, price range, categories, AI categories)
 * - Pricelist priority configuration with drag-and-drop
 * - Save/load export configurations
 * - CSV generation and download
 * - Preview functionality
 * - Direct download and shareable API links
 *
 * The export system transforms product data from the backend API into various
 * formats suitable for different use cases (e-commerce platforms, inventory management,
 * data analysis, etc.).
 *
 * @module ExportPage
 */

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

/**
 * Export preset configurations.
 *
 * Each preset defines:
 * - name: Display name
 * - description: Brief explanation of use case
 * - icon: SVG icon component
 * - fields: Array of available fields with labels and default selection
 *
 * Preset Types:
 * - shopify: Standard Shopify product import CSV format
 * - simple: Basic product list for general use
 * - detailed: Comprehensive data export with all metadata
 * - inventory: Stock levels and pricing information
 *
 * @type {Object}
 */
const EXPORT_PRESETS = {
    shopify: {
        name: "Shopify",
        description: "Standard Shopify product import format",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 109.5 124.5" fill="currentColor">
                <path d="M95.9 23.9c-.1-.6-.6-1-1.1-1-.5 0-9.3-.2-9.3-.2s-7.4-7.2-8.1-7.9c-.7-.7-2.2-.5-2.7-.3 0 0-1.4.4-3.7 1.1-.4-1.3-1-2.8-1.8-4.4-2.6-5-6.5-7.7-11.1-7.7-.3 0-.6 0-1 .1-.1-.2-.3-.3-.4-.5-2-2.2-4.6-3.2-7.7-3.1-6 .2-12 4.5-16.8 12.2-3.4 5.4-6 12.2-6.7 17.5-6.9 2.1-11.7 3.6-11.8 3.7-3.5 1.1-3.6 1.2-4 4.5-.3 2.5-9.5 73.1-9.5 73.1l75.6 13.1 32.6-8.1S96 24.4 95.9 23.9zM67.2 16.8l-5.9 1.8c0-3-.4-7.3-1.8-10.9 4.5.9 6.7 5.9 7.7 9.1zm-10 3.1l-12.7 3.9c1.2-4.7 3.6-9.4 6.4-12.5 1.1-1.1 2.6-2.4 4.3-3.1 1.7 3.5 2.1 8.4 2 11.7zm-8-14.9c1.4 0 2.6.3 3.6.9-1.6.8-3.2 2.1-4.7 3.6-3.8 4.1-6.7 10.5-7.9 16.6l-10.4 3.2c2-9.8 9.9-23.6 19.4-24.3z" />
                <path d="M94.8 22.9c-.5 0-9.3-.2-9.3-.2s-7.4-7.2-8.1-7.9c-.3-.3-.6-.4-1-.4l-4.8 97.3 32.6-8.1s-8.2-55.8-8.3-56.5c-.1-.6-.6-1.1-1.1-1.2z" fill="currentColor" opacity="0.15" />
                <path d="M56.1 39.9l-4.3 12.9s-4.8-2.5-10.6-2.1c-8.5.6-8.6 5.9-8.5 7.2.5 6.9 18.6 8.4 19.6 24.6.8 12.7-6.7 21.4-17.6 22.1-13.1.8-20.3-6.9-20.3-6.9l2.8-11.8s7.3 5.5 13.1 5.1c3.8-.2 5.2-3.4 5-5.6-.6-9-15.4-8.5-16.3-23.3-.8-12.4 7.4-25 25.4-26.1 6.9-.5 10.7 1.9 10.7 1.9z" fill="#fff" />
            </svg>
        ),
        fields: [
            { key: "handle", label: "Handle", default: true },
            { key: "title", label: "Title", default: true },
            { key: "body_html", label: "Body (HTML)", default: true },
            { key: "vendor", label: "Vendor", default: true },
            { key: "type", label: "Type", default: false },
            { key: "tags", label: "Tags", default: true },
            { key: "ai_tags", label: "Collection", description: "Leaf category name only (e.g. \"Phones\" from \"Electronics / Phones\")", default: true },
            { key: "published", label: "Published", default: true },
            { key: "variant_sku", label: "Variant SKU", default: true },
            { key: "variant_title", label: "Variant Title", default: true },
            { key: "variant_price", label: "Variant Price", default: true },
            { key: "variant_compare_at_price", label: "Compare At Price", default: false },
            { key: "variant_inventory", label: "Inventory", group: [{ key: "variant_inventory_tracker", label: "Variant Inventory Tracker" }, { key: "variant_inventory_qty", label: "Variant Inventory Qty" }, { key: "variant_inventory_policy", label: "Variant Inventory Policy" }, { key: "variant_fulfillment_service", label: "Variant Fulfillment Service" }], default: true },
            { key: "variant_barcode", label: "Barcode", default: true },
            { key: "image_src", label: "Image Src", default: true },
            { key: "image_alt_text", label: "Image Alt Text", default: false },
            { key: "variant_image", label: "Variant Image", default: true },
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
            { key: "categories", label: "Tags", default: true },
            { key: "ai_category_names", label: "Collection", description: "Full category path (e.g. \"Electronics / Phones\")", default: false },
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
            { key: "categories", label: "Tags", default: true },
            { key: "ai_export_ids", label: "AI Export IDs", default: false },
            { key: "ai_category_names", label: "Collection", description: "Full category path (e.g. \"Electronics / Phones\")", default: false },
            { key: "ai_category_ids", label: "Collection IDs", description: "MongoDB IDs of matched categories", default: false },
            { key: "ai_category_full", label: "Collection (Full)", description: "exportId + categoryId + name as JSON", default: false },
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

// Field keys that require an AI export to be selected — hidden otherwise
const AI_FIELD_KEYS = new Set(["ai_tags", "ai_category_names", "ai_category_ids", "ai_category_full", "ai_export_ids"]);

/**
 * Strips HTML tags from a string.
 * Used to sanitize HTML descriptions for CSV export.
 *
 * @param {string} html - HTML string to sanitize
 * @returns {string} Plain text without HTML tags
 *
 * @example
 * stripHtml("<p>Hello <strong>World</strong></p>") // Returns "Hello World"
 */
function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Escapes a value for safe CSV output.
 *
 * Wraps values in double quotes if they contain:
 * - Commas
 * - Double quotes (which are escaped as "")
 * - Newlines
 *
 * @param {*} value - Value to escape (converted to string)
 * @returns {string} CSV-safe value
 *
 * @example
 * escapeCSV('Test, value') // Returns '"Test, value"'
 * escapeCSV('Say "hello"') // Returns '"Say ""hello"""'
 */
function escapeCSV(value) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Formats a date string to YYYY-MM-DD format.
 *
 * @param {string} dateStr - ISO date string or parseable date
 * @returns {string} Formatted date or empty string if invalid
 *
 * @example
 * formatDate("2024-01-15T10:30:00Z") // Returns "2024-01-15"
 */
function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
        return new Date(dateStr).toISOString().split("T")[0];
    } catch {
        return "";
    }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
);

const DownloadIcon = ({ size = 4 }) => (
    <svg className={`w-${size} h-${size}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const KeyIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const LoadIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const FilterIcon = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

// Format metadata: color schemes, icons, labels
const FORMAT_META = {
    csv: {
        label: 'CSV',
        color: 'emerald',
        bg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
        text: 'text-emerald-400',
        activeBg: 'bg-emerald-500/20',
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
        ),
    },
    json: {
        label: 'JSON',
        color: 'amber',
        bg: 'bg-amber-500/15 hover:bg-amber-500/25',
        text: 'text-amber-400',
        activeBg: 'bg-amber-500/20',
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
    },
    xml: {
        label: 'XML',
        color: 'orange',
        bg: 'bg-orange-500/15 hover:bg-orange-500/25',
        text: 'text-orange-400',
        activeBg: 'bg-orange-500/20',
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l-4 4 4 4m10-8l4 4-4 4M14 4l-4 16" />
            </svg>
        ),
    },
};

/**
 * Export Page Component
 *
 * Main component for configuring and generating product data exports.
 *
 * @param {Object} props - Component props
 * @param {Array} props.initialProducts - Product data from API
 * @param {string} props.apiUrl - Backend API URL for saved exports
 * @returns {JSX.Element} Export configuration UI
 */
// Client-side filter application for preview — mirrors backend applyFilters, backwards-compatible
function applyFiltersLocal(products, filters) {
    if (!filters) return products;
    return products.filter(product => {
        if (filters.search?.trim()) {
            const s = filters.search.toLowerCase();
            const match = product.product_name?.toLowerCase().includes(s) ||
                product.code?.toLowerCase().includes(s) ||
                product.child_products?.some(v => v.code?.toLowerCase().includes(s) || v.ean_code?.toLowerCase().includes(s));
            if (!match) return false;
        }
        if (filters.stockStatus !== 'all') {
            const variants = product.child_products || [];
            const hasStock = variants.length > 0
                ? variants.some(v => v.stock_amount > 0)
                : (product.stock_amount || 0) > 0;
            if (filters.stockStatus === 'in_stock' && !hasStock) return false;
            if (filters.stockStatus === 'out_of_stock' && hasStock) return false;
        }
        if (filters.minPrice || filters.maxPrice) {
            const variants = product.child_products || [];
            const prices = variants.length > 0
                ? variants.flatMap(v => v.pricelist?.map(p => p.price) || []).filter(p => p > 0)
                : (product.pricelist?.map(p => p.price) || []).filter(p => p > 0);
            if (!prices.length) return false;
            if (filters.minPrice && Math.max(...prices) < parseFloat(filters.minPrice)) return false;
            if (filters.maxPrice && Math.min(...prices) > parseFloat(filters.maxPrice)) return false;
        }
        const categories = Array.isArray(filters.category) ? filters.category : (filters.category && filters.category !== 'all' ? [filters.category] : []);
        if (categories.length > 0 && !categories.some(cat => product.categories?.includes(cat))) return false;
        if (filters.aiExportId && filters.aiExportId !== 'all' && !product.ai_categories?.some(c => c.exportId === filters.aiExportId)) return false;
        const aiCategories = Array.isArray(filters.aiCategory) ? filters.aiCategory : (filters.aiCategory && filters.aiCategory !== 'all' ? [filters.aiCategory] : []);
        if (aiCategories.length > 0) {
            const hasAi = aiCategories.some(prefix =>
                product.ai_categories?.some(c =>
                    (c.categoryName === prefix || c.categoryName?.startsWith(prefix + ' / ')) &&
                    (filters.aiExportId === 'all' || c.exportId === filters.aiExportId)
                )
            );
            if (!hasAi) return false;
        }
        if (filters.imageFilter && filters.imageFilter !== 'all') {
            const hasImg = (product.images || []).length > 0 || product.child_products?.some(v => (v.images || []).length > 0);
            if (filters.imageFilter === 'with_images' && !hasImg) return false;
            if (filters.imageFilter === 'without_images' && hasImg) return false;
        }
        if (filters.showNew && !product.new) return false;
        if (filters.showRecommended && !product.recomended) return false;
        if (filters.publishedOnly && !product.published) return false;
        if (filters.excludeCloseOut && product.product_name?.toUpperCase().includes('CLOSE OUT')) return false;
        return true;
    });
}

export default function ExportPage({ initialProducts = [], apiUrl = '', allowedExports = null }) {
    // State management
    const [selectedPreset, setSelectedPreset] = useState("shopify");
    const [selectedFields, setSelectedFields] = useState(() => {
        const preset = EXPORT_PRESETS.shopify;
        return preset.fields.filter((f) => f.default).flatMap((f) => f.group ? f.group.map(g => g.key) : [f.key]);
    });
    const [filters, setFilters] = useState({
        search: "",
        stockStatus: "all",
        minPrice: "",
        maxPrice: "",
        category: [],
        aiExportId: "all",
        aiCategory: [],
        imageFilter: "all",
        showNew: false,
        showRecommended: false,
        publishedOnly: false,
        excludeCloseOut: false,
    });
    const [pricelistPriority, setPricelistPriority] = useState([]);
    const [exportStatus, setExportStatus] = useState("");
    const [activeTab, setActiveTab] = useState("configure"); // configure, saved
    const [savedExports, setSavedExports] = useState([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [exportName, setExportName] = useState("");
    const [exportDescription, setExportDescription] = useState("");
    const [currentConfigId, setCurrentConfigId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingExports, setIsLoadingExports] = useState(false);
    const [previewLimit, setPreviewLimit] = useState(5);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dropIndicator, setDropIndicator] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [showKeysModal, setShowKeysModal] = useState(false);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [activeExportId, setActiveExportId] = useState(null);
    const [exportKeys, setExportKeys] = useState([]);
    const [exportAccess, setExportAccess] = useState([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [createdKeyRaw, setCreatedKeyRaw] = useState(null);
    const [newGrantEmail, setNewGrantEmail] = useState('');
    const [isKeyLoading, setIsKeyLoading] = useState(false);
    const [isAccessLoading, setIsAccessLoading] = useState(false);
    const [copiedField, setCopiedField] = useState(null); // 'key' | 'csv' | 'json' | 'xml' | null
    const [createdKeyTab, setCreatedKeyTab] = useState('key'); // 'key' | 'endpoints' | 'usage'
    const [expandedKeyId, setExpandedKeyId] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState(new Set()); // paths expanded in category tree
    const [exportStep, setExportStep] = useState('format'); // 'format' | 'filters' | 'fields' | 'export'
    const [showPreview, setShowPreview] = useState(false);
    const [previewConfig, setPreviewConfig] = useState(null); // null = live filteredProducts, or saved config object
    const [previewView, setPreviewView] = useState('grid'); // 'grid' | 'list'
    const [previewSearch, setPreviewSearch] = useState('');
    const [fieldInfoModal, setFieldInfoModal] = useState(null); // field object | null
    const [aiLeafMode, setAiLeafMode] = useState({ ai_tags: false, ai_category_names: false });
    const [inventoryLocationName, setInventoryLocationName] = useState('');

    /**
     * Extracts and memoizes all unique pricelists from products.
     * Sorts by validity date (newest first) for default priority ordering.
     *
     * @type {Array<Object>} Array of pricelist objects with name and validFrom
     */
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

    // Categories available given current filters (excluding the category filter itself) with per-category product counts
    const { dynamicCategories, categoryProductCounts } = useMemo(() => {
        const catCounts = new Map();
        initialProducts.forEach(product => {
            if (filters.search) {
                const sl = filters.search.toLowerCase();
                const match = product.product_name?.toLowerCase().includes(sl) ||
                    product.code?.toLowerCase().includes(sl) ||
                    product.short_description?.toLowerCase().includes(sl) ||
                    product.child_products?.some(v => v.code?.toLowerCase().includes(sl) || v.ean_code?.toLowerCase().includes(sl));
                if (!match) return;
            }
            if (filters.stockStatus !== 'all') {
                const hasStock = product.child_products?.some(v => v.stock_amount > 0);
                if (filters.stockStatus === 'in_stock' && !hasStock) return;
                if (filters.stockStatus === 'out_of_stock' && hasStock) return;
            }
            if (filters.minPrice || filters.maxPrice) {
                const prices = product.child_products?.map(v => {
                    const p = v.pricelist?.[0]; return p?.price || 0;
                }).filter(p => p > 0) || [];
                if (!prices.length) return;
                const lo = Math.min(...prices), hi = Math.max(...prices);
                if (filters.minPrice && hi < parseFloat(filters.minPrice)) return;
                if (filters.maxPrice && lo > parseFloat(filters.maxPrice)) return;
            }
            if (filters.aiExportId !== 'all') {
                if (!product.ai_categories?.some(c => c.exportId === filters.aiExportId)) return;
            }
            if (filters.aiCategory.length > 0) {
                if (!filters.aiCategory.some(prefix =>
                    product.ai_categories?.some(c =>
                        (c.categoryName === prefix || c.categoryName?.startsWith(prefix + ' / ')) &&
                        (filters.aiExportId === 'all' || c.exportId === filters.aiExportId)))) return;
            }
            if (filters.imageFilter !== 'all') {
                const hasImg = (product.images || []).length > 0 ||
                    (product.child_products || []).some(v => (v.images || []).length > 0);
                if (filters.imageFilter === 'with_images' && !hasImg) return;
                if (filters.imageFilter === 'without_images' && hasImg) return;
            }
            if (filters.showNew && !product.new) return;
            if (filters.showRecommended && !product.recomended) return;
            if (filters.publishedOnly && !product.published) return;
            if (filters.excludeCloseOut && product.product_name?.toUpperCase().includes('CLOSE OUT')) return;
            product.categories?.forEach(cat => catCounts.set(cat, (catCounts.get(cat) || 0) + 1));
        });
        return { dynamicCategories: Array.from(catCounts.keys()).sort(), categoryProductCounts: catCounts };
    }, [initialProducts, filters.search, filters.stockStatus, filters.minPrice, filters.maxPrice,
        filters.aiExportId, filters.aiCategory, filters.imageFilter,
        filters.showNew, filters.showRecommended, filters.publishedOnly, filters.excludeCloseOut]);

    // Extract AI exports: role-filtered when allowedExports is provided, otherwise derived from product data
    const availableAiExports = useMemo(() => {
        if (allowedExports !== null) {
            // Role-based: only show exports this user is allowed to see that also have product data
            const inProducts = new Set();
            initialProducts.forEach(p => p.ai_categories?.forEach(c => { if (c.exportId) inProducts.add(c.exportId); }));
            return allowedExports
                .filter(exp => inProducts.has(String(exp._id)))
                .map(exp => ({ exportId: String(exp._id), name: exp.name, logo: exp.logo || null }));
        }
        // Fallback: derive from product data (no role filtering)
        const exportMap = new Map();
        initialProducts.forEach((product) => {
            product.ai_categories?.forEach((cat) => {
                if (cat.exportId && !exportMap.has(cat.exportId)) {
                    exportMap.set(cat.exportId, {
                        exportId: cat.exportId,
                        name: cat.categoryName?.split(" / ")[0] || cat.exportId.slice(-6),
                        logo: null,
                    });
                }
            });
        });
        return Array.from(exportMap.values());
    }, [initialProducts, allowedExports]);

    // Extract AI categories filtered by selected exportId (keyed by name for tree deduplication)
    const availableAiCategories = useMemo(() => {
        const categoryMap = new Map();
        initialProducts.forEach((product) => {
            product.ai_categories?.forEach((cat) => {
                if (filters.aiExportId !== "all" && cat.exportId !== filters.aiExportId) return;
                if (cat.categoryName && !categoryMap.has(cat.categoryName)) {
                    categoryMap.set(cat.categoryName, {
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

    // Build a nested tree from flat "A / B / C" category names
    const categoryTree = useMemo(() => {
        const root = {};
        availableAiCategories.forEach(({ categoryName }) => {
            if (!categoryName) return;
            const parts = categoryName.split(" / ").map(p => p.trim());
            let node = root;
            let path = "";
            parts.forEach((part, i) => {
                path = i === 0 ? part : `${path} / ${part}`;
                if (!node[part]) node[part] = { _path: path, children: {} };
                node = node[part].children;
            });
        });
        return root;
    }, [availableAiCategories]);

    // Count products per category prefix (so "Furniture" shows count of all furniture products)
    const productCountByPrefix = useMemo(() => {
        const counts = {};
        initialProducts.forEach(p => {
            p.ai_categories?.forEach(c => {
                if (filters.aiExportId !== "all" && c.exportId !== filters.aiExportId) return;
                if (!c.categoryName) return;
                const parts = c.categoryName.split(" / ").map(s => s.trim());
                let prefix = "";
                parts.forEach((part, i) => {
                    prefix = i === 0 ? part : `${prefix} / ${part}`;
                    counts[prefix] = (counts[prefix] || 0) + 1;
                });
            });
        });
        return counts;
    }, [initialProducts, filters.aiExportId]);

    // Auto-select the export when there is exactly one available (single-company user)
    useEffect(() => {
        if (availableAiExports.length === 1 && filters.aiExportId === "all") {
            setFilters(prev => ({ ...prev, aiExportId: availableAiExports[0].exportId, aiCategory: [] }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableAiExports]);

    // Auto-deselect AI fields when no AI export is selected or none exist
    useEffect(() => {
        const aiAvailable = availableAiExports.length > 0 && filters.aiExportId !== "all";
        if (!aiAvailable) {
            setSelectedFields(prev => prev.filter(k => !AI_FIELD_KEYS.has(k)));
        }
    }, [availableAiExports, filters.aiExportId]);

    // Auto-remove categories that no longer have matching products given other active filters
    useEffect(() => {
        if (filters.category.length === 0) return;
        const valid = filters.category.filter(cat => dynamicCategories.includes(cat));
        if (valid.length !== filters.category.length) {
            setFilters(prev => ({ ...prev, category: valid }));
        }
    }, [dynamicCategories, filters.category]);

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
                const variants = product.child_products || [];
                const hasStock = variants.length > 0
                    ? variants.some((v) => v.stock_amount > 0)
                    : (product.stock_amount || 0) > 0;
                if (filters.stockStatus === "in_stock" && !hasStock) return false;
                if (filters.stockStatus === "out_of_stock" && hasStock) return false;
            }

            if (filters.minPrice || filters.maxPrice) {
                const variants = product.child_products || [];
                const prices = variants.length > 0
                    ? variants.map((v) => getPriceFromPriority(v).price).filter((p) => p > 0)
                    : [getPriceFromPriority(product).price].filter((p) => p > 0);

                if (prices.length === 0) return false;
                const minProductPrice = Math.min(...prices);
                const maxProductPrice = Math.max(...prices);

                if (filters.minPrice && maxProductPrice < parseFloat(filters.minPrice)) return false;
                if (filters.maxPrice && minProductPrice > parseFloat(filters.maxPrice)) return false;
            }

            if (filters.category.length > 0) {
                if (!filters.category.some(cat => product.categories?.includes(cat))) return false;
            }

            if (filters.aiExportId !== "all") {
                const hasExport = product.ai_categories?.some((c) => c.exportId === filters.aiExportId);
                if (!hasExport) return false;
            }

            if (filters.aiCategory.length > 0) {
                const hasAiCategory = filters.aiCategory.some(prefix =>
                    product.ai_categories?.some(
                        (c) => (c.categoryName === prefix || c.categoryName?.startsWith(prefix + " / ")) &&
                            (filters.aiExportId === "all" || c.exportId === filters.aiExportId)
                    )
                );
                if (!hasAiCategory) return false;
            }

            if (filters.imageFilter && filters.imageFilter !== "all") {
                const parentImages = product.images || [];
                const childImages = (product.child_products || []).flatMap((v) => v.images || []);
                const hasImages = parentImages.length > 0 || childImages.length > 0;
                if (filters.imageFilter === "with_images" && !hasImages) return false;
                if (filters.imageFilter === "without_images" && hasImages) return false;
            }

            if (filters.showNew && !product.new) return false;
            if (filters.showRecommended && !product.recomended) return false;
            if (filters.publishedOnly && !product.published) return false;
            if (filters.excludeCloseOut && product.product_name?.toUpperCase().includes('CLOSE OUT')) return false;

            return true;
        });
    }, [initialProducts, filters, getPriceFromPriority]);

    // Products to show in the preview panel
    const previewBaseProducts = useMemo(() => {
        if (previewConfig) return applyFiltersLocal(initialProducts, previewConfig.filters);
        return filteredProducts;
    }, [previewConfig, filteredProducts, initialProducts]);

    const previewDisplayProducts = useMemo(() => {
        if (!previewSearch.trim()) return previewBaseProducts;
        const s = previewSearch.toLowerCase();
        return previewBaseProducts.filter(p =>
            p.product_name?.toLowerCase().includes(s) ||
            p.code?.toLowerCase().includes(s) ||
            p.categories?.some(c => c.toLowerCase().includes(s))
        );
    }, [previewBaseProducts, previewSearch]);

    // Handle preset change
    const handlePresetChange = (presetKey) => {
        setSelectedPreset(presetKey);
        setCurrentConfigId(null);
        const preset = EXPORT_PRESETS[presetKey];
        setSelectedFields(preset.fields.filter((f) => f.default).flatMap((f) => f.group ? f.group.map(g => g.key) : [f.key]));
    };

    // Toggle field selection
    const toggleField = (field) => {
        if (field.group) {
            const groupKeys = field.group.map((g) => g.key);
            setSelectedFields((prev) => {
                const allSelected = groupKeys.every((k) => prev.includes(k));
                return allSelected
                    ? prev.filter((k) => !groupKeys.includes(k))
                    : [...new Set([...prev, ...groupKeys])];
            });
        } else {
            setSelectedFields((prev) =>
                prev.includes(field.key) ? prev.filter((k) => k !== field.key) : [...prev, field.key]
            );
        }
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
            case "tags": {
                if (isShopify && !isFirstRow) return "";
                let baseTags;
                if (filters.aiExportId && filters.aiExportId !== "all") {
                    const filtered = product.ai_categories?.filter((c) => c.exportId === filters.aiExportId) || [];
                    baseTags = filtered.length > 0
                        ? [...new Set(filtered.flatMap((c) => {
                            const parts = c.categoryName.split(" / ");
                            return parts.map((_, i) => parts.slice(0, i + 1).join(" / "));
                        }))]
                        : (product.categories || []);
                } else {
                    baseTags = product.categories || [];
                }
                const extraTags = [
                    product.new ? "new" : "",
                    product.recomended ? "recommended" : "",
                ].filter(Boolean);
                return [...baseTags, ...extraTags].join(", ");
            }
            case "ai_tags":
                if (isShopify && !isFirstRow) return "";
                const filteredAiCats = filters.aiExportId !== "all"
                    ? product.ai_categories?.filter((c) => c.exportId === filters.aiExportId)
                    : product.ai_categories;
                return (filteredAiCats?.map((c) => aiLeafMode.ai_tags ? c.categoryName.split(" / ").pop().trim() : c.categoryName) || []).join(", ");
            case "published":
                return isShopify ? (isFirstRow ? (product.published ? "TRUE" : "FALSE") : "") : (product.published ? "TRUE" : "FALSE");
            case "variant_sku":
                return variant?.code || product.code || "";
            case "variant_title":
                return variant?.product_name || product.product_name || "";
            case "variant_price":
                return priceInfo.price > 0 ? priceInfo.price.toFixed(2) : "";
            case "variant_compare_at_price": {
                const pricelist = variant?.pricelist ?? (product.child_products?.length === 0 ? product.pricelist : null);
                if (!pricelist) return "";
                const enabledPricelists = pricelistPriority.filter((p) => p.enabled);
                if (enabledPricelists.length > 1) {
                    const secondPricelist = enabledPricelists[1];
                    const found = pricelist.find((p) => p.name === secondPricelist?.name);
                    return found?.price?.toFixed(2) || "";
                }
                return "";
            }
            case "variant_inventory_tracker":
                return "shopify";
            case "variant_inventory_qty":
                return variant != null ? (variant.stock_amount || 0) : (product.stock_amount || 0);
            case "variant_inventory_policy":
                return (variant?.allow_backorder || product.allow_backorder) ? "continue" : "deny";
            case "variant_fulfillment_service":
                return "manual";
            case "variant_barcode":
                return variant?.ean_code || product.ean_code || "";
            case "image_src":
                return isShopify ? (imageParam || "") : (product.images?.[0] || "");
            case "image_alt_text":
                return product.product_name || "";
            case "variant_image":
                return variant?.images?.[0] || product.images?.[0] || "";
            case "product_name":
                return product.product_name || "";
            case "variant_name":
                return variant?.product_name || product.product_name || "";
            case "sku":
            case "variant_code":
                return variant?.code || product.code || "";
            case "ean":
                return variant?.ean_code || product.ean_code || "";
            case "price":
                return priceInfo.price > 0 ? priceInfo.price.toFixed(2) : "";
            case "pricelist_name":
                return priceInfo.name || "";
            case "vat":
                return priceInfo.price > 0 ? priceInfo.vat : "";
            case "price_with_vat":
                return priceInfo.price > 0 ? priceWithVat.toFixed(2) : "";
            case "stock": {
                const qty = variant != null ? (variant.stock_amount || 0) : (product.stock_amount || 0);
                return qty;
            }
            case "stock_value": {
                const qty = variant != null ? (variant.stock_amount || 0) : (product.stock_amount || 0);
                return (qty * priceInfo.price).toFixed(2);
            }
            case "in_stock": {
                const qty = variant != null ? (variant.stock_amount || 0) : (product.stock_amount || 0);
                return qty > 0 ? "Yes" : "No";
            }
            case "categories": {
                if (filters.aiExportId && filters.aiExportId !== "all") {
                    const filtered = product.ai_categories?.filter((c) => c.exportId === filters.aiExportId) || [];
                    if (filtered.length > 0) {
                        return [...new Set(filtered.flatMap((c) => {
                            const parts = c.categoryName.split(" / ");
                            return parts.map((_, i) => parts.slice(0, i + 1).join(" / "));
                        }))].join(", ");
                    }
                }
                return (product.categories || []).join(", ");
            }
            case "ai_export_ids":
                const exportIds = [...new Set(product.ai_categories?.map((c) => c.exportId) || [])];
                return exportIds.join("; ");
            case "ai_category_names":
                const filteredCatsNames = filters.aiExportId !== "all"
                    ? product.ai_categories?.filter((c) => c.exportId === filters.aiExportId)
                    : product.ai_categories;
                return (filteredCatsNames?.map((c) => aiLeafMode.ai_category_names ? c.categoryName.split(" / ").pop().trim() : c.categoryName) || []).join("; ");
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
                return variant?.token || product.token || "";
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

        const expandedFields = preset.fields.flatMap((f) => f.group || [f]);
        const headers = expandedFields
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
                const variantRowCount = Math.max(variants.length, 1);
                const numImages = uniqueImages.length;
                const maxRows = Math.max(variantRowCount, numImages);

                for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
                    const row = [];
                    const hasVariant = rowIdx < variants.length;
                    const variant = hasVariant ? variants[rowIdx] : null;
                    // Image-only rows start after all variant rows (row 0 is always a real product row)
                    const isImageOnlyRow = rowIdx >= variantRowCount && rowIdx < numImages;
                    const currentImage = uniqueImages[rowIdx] || "";
                    const priceSource = variant ?? (variants.length === 0 ? product : null);
                    const priceInfo = priceSource ? getPriceFromPriority(priceSource) : { price: 0, vat: 0, name: "" };

                    expandedFields.forEach((field) => {
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
                    const priceSource = variant ?? product;
                    const priceInfo = getPriceFromPriority(priceSource);

                    expandedFields.forEach((field) => {
                        if (!selectedFields.includes(field.key)) return;
                        const value = getFieldValue(field.key, product, variant, variantIndex, "", priceInfo, false, false);
                        row.push(escapeCSV(value));
                    });

                    rows.push(row.join(","));
                });
            }
        });

        return rows.join("\n");
    }, [selectedPreset, selectedFields, filteredProducts, getPriceFromPriority, filters.aiExportId, pricelistPriority, aiLeafMode]);

    // Shared row generator — same logic as generateCSVData but returns array of {fieldKey: value} objects
    const generateRows = useCallback(() => {
        const preset = EXPORT_PRESETS[selectedPreset];
        const isShopify = selectedPreset === "shopify";
        const rows = [];
        const expandedFields = preset.fields.flatMap((f) => f.group || [f]);

        filteredProducts.forEach((product) => {
            const variants = product.child_products || [];
            const allImages = [...new Set([
                ...(product.images || []),
                ...variants.flatMap((v) => v.images || []),
            ])];

            if (isShopify) {
                const variantRowCount = Math.max(variants.length, 1);
                const maxRows = Math.max(variantRowCount, allImages.length);
                for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
                    const variant = variants[rowIdx] || null;
                    const isImageOnlyRow = rowIdx >= variantRowCount && rowIdx < allImages.length;
                    const currentImage = allImages[rowIdx] || "";
                    const priceSource = variant ?? (variants.length === 0 ? product : null);
                    const priceInfo = priceSource ? getPriceFromPriority(priceSource) : { price: 0, vat: 0, name: "" };
                    const row = {};
                    expandedFields.forEach((field) => {
                        if (!selectedFields.includes(field.key)) return;
                        row[field.key] = getFieldValue(field.key, product, variant, rowIdx, currentImage, priceInfo, isImageOnlyRow, true);
                    });
                    rows.push(row);
                }
            } else {
                const variantsToExport = variants.length > 0 ? variants : [null];
                variantsToExport.forEach((variant, idx) => {
                    const priceSource = variant ?? product;
                    const priceInfo = getPriceFromPriority(priceSource);
                    const row = {};
                    expandedFields.forEach((field) => {
                        if (!selectedFields.includes(field.key)) return;
                        row[field.key] = getFieldValue(field.key, product, variant, idx, "", priceInfo, false, false);
                    });
                    rows.push(row);
                });
            }
        });
        return rows;
    }, [selectedPreset, selectedFields, filteredProducts, getPriceFromPriority, filters.aiExportId, pricelistPriority, aiLeafMode]);

    // Generate JSON: array of objects keyed by column header name (matches API/CSV headers)
    const generateJsonData = useCallback(() => {
        const preset = EXPORT_PRESETS[selectedPreset];
        const activeFields = preset.fields.filter(f => selectedFields.includes(f.key));
        const rows = generateRows();
        return {
            success: true,
            generatedAt: new Date().toISOString(),
            totalRows: rows.length,
            data: rows.map(row => {
                const obj = {};
                activeFields.forEach(f => { obj[f.label] = row[f.key] ?? ''; });
                return obj;
            }),
        };
    }, [generateRows, selectedPreset, selectedFields]);

    // Generate XML: flat row-based matching API format, CDATA for HTML fields
    const generateXmlData = useCallback(() => {
        const HTML_FIELDS = new Set(['body_html', 'short_description', 'detailed_description']);
        const escXml = (val) => String(val ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

        const rowXmls = generateRows().map(row => {
            const lines = selectedFields.map(key => {
                const val = String(row[key] ?? '');
                const content = HTML_FIELDS.has(key) ? `<![CDATA[${val}]]>` : escXml(val);
                return `    <${key}>${content}</${key}>`;
            }).join('\n');
            return `  <row>\n${lines}\n  </row>`;
        });
        return `<?xml version="1.0" encoding="UTF-8"?>\n<export>\n${rowXmls.join('\n')}\n</export>`;
    }, [generateRows, selectedFields]);

    // Download via API — saves/updates the config first to get a stable ID, then proxies through the backend
    const handleDownload = async (format = 'csv') => {
        if (filteredProducts.length === 0) {
            setExportStatus("No products to export");
            setTimeout(() => setExportStatus(""), 3000);
            return;
        }

        const exportConfig = {
            preset: selectedPreset,
            selectedFields: selectedPreset === 'inventory' ? ['sku'] : selectedFields,
            filters,
            pricelistPriority,
            aiLeafMode,
            ...(selectedPreset === 'inventory' && { inventoryLocationName }),
        };

        const downloadKey = `current-${format}`;
        setDownloadingId(downloadKey);
        try {
            let configId = currentConfigId;

            if (configId) {
                // Update existing config so the API generates from current settings
                const res = await fetch(`/nextapi/export/custom-export/${configId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(exportConfig),
                });
                if (!res.ok) throw new Error(`Failed to update config: ${res.status}`);
            } else {
                // Auto-save with current name or a generated one
                const name = exportName.trim() || `Export ${new Date().toISOString().split("T")[0]}`;
                const res = await fetch(`/nextapi/export/custom-export`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...exportConfig, name }),
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || `Failed to save config: ${res.status}`);
                }
                const result = await res.json();
                configId = result.data._id;
                setCurrentConfigId(configId);
                setSavedExports((prev) => [result.data, ...prev]);
            }

            await downloadFromAPI(configId, format);
        } catch (error) {
            console.error("Download error:", error);
            setExportStatus("Download failed");
            setTimeout(() => setExportStatus(""), 3000);
        } finally {
            setDownloadingId(null);
        }
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
                selectedFields: selectedPreset === 'inventory' ? ['sku'] : selectedFields,
                filters,
                pricelistPriority,
                aiLeafMode,
                ...(selectedPreset === 'inventory' && { inventoryLocationName }),
            };

            const response = await fetch(`/nextapi/export/custom-export`, {
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
            setCurrentConfigId(result.data._id);
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

    // Load saved exports - GET /nextapi/export/custom-export
    const loadSavedExports = async () => {
        setIsLoadingExports(true);
        try {
            const response = await fetch(`/nextapi/export/custom-export`);

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
            category: [],
            aiExportId: "all",
            aiCategory: [],
            imageFilter: "all",
            showNew: false,
            showRecommended: false,
            publishedOnly: false,
            excludeCloseOut: false,
            ...config.filters,
        });

        // Set pricelist priority if available
        if (config.pricelistPriority?.length > 0) {
            setPricelistPriority(config.pricelistPriority);
        }

        // Restore leaf mode if saved
        if (config.aiLeafMode) {
            setAiLeafMode({
                ai_tags: config.aiLeafMode.ai_tags === true,
                ai_category_names: config.aiLeafMode.ai_category_names === true,
            });
        }

        // Restore inventory location name
        setInventoryLocationName(config.inventoryLocationName || '');

        setCurrentConfigId(config._id);
        setActiveTab("configure");
        setExportStep("format");
        setExportStatus("Configuration loaded!");
        setTimeout(() => setExportStatus(""), 3000);
    };

    // Delete export - DELETE /nextapi/export/custom-export/:id
    const deleteExport = async (id) => {
        try {
            const response = await fetch(`/nextapi/export/custom-export/${id}`, {
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

    // Download via API proxy - supports csv, json, xml formats
    const downloadFromAPI = async (configId, format = 'csv') => {
        const downloadKey = `${configId}-${format}`;
        setDownloadingId(downloadKey);
        try {
            const response = await fetch(`/nextapi/export/custom-export/${configId}/${format}`);

            if (!response.ok) {
                throw new Error(`Failed to download: ${response.status}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `patrik_products_${configId}.${format}`;
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

    // Open Keys modal (replaces old "copy link" — links now require an API key)
    const copyExportLink = async (configId) => {
        openKeysModal(configId);
    };

    // Keys modal handlers
    const openKeysModal = async (exportId) => {
        setActiveExportId(exportId);
        setCreatedKeyRaw(null);
        setNewKeyName('');
        setShowKeysModal(true);
        setIsKeyLoading(true);
        try {
            const res = await fetch(`/nextapi/export/custom-export/${exportId}/keys`);
            const data = await res.json();
            setExportKeys(data.success ? data.data : []);
        } catch (_) {
            setExportKeys([]);
        } finally {
            setIsKeyLoading(false);
        }
    };

    const closeKeysModal = () => {
        setShowKeysModal(false);
        setActiveExportId(null);
        setCreatedKeyRaw(null);
        setNewKeyName('');
        setCopiedField(null);
        setCreatedKeyTab('key');
        setExpandedKeyId(null);
    };

    const handleCreateKey = async () => {
        if (!newKeyName.trim() || !activeExportId) return;
        setIsKeyLoading(true);
        try {
            const res = await fetch(`/nextapi/export/custom-export/${activeExportId}/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setCreatedKeyRaw(data.data.rawKey);
                setCreatedKeyTab('key');
                setExpandedKeyId(null);
                setNewKeyName('');
                // Refresh key list
                const listRes = await fetch(`/nextapi/export/custom-export/${activeExportId}/keys`);
                const listData = await listRes.json();
                setExportKeys(listData.success ? listData.data : []);
            }
        } catch (_) {}
        setIsKeyLoading(false);
    };

    const handleRevokeKey = async (keyId) => {
        if (!activeExportId) return;
        try {
            await fetch(`/nextapi/export/custom-export/${activeExportId}/keys/${keyId}`, { method: 'DELETE' });
            setExportKeys(prev => prev.map(k => k.keyId === keyId ? { ...k, isActive: false } : k));
        } catch (_) {}
    };

    // Access modal handlers
    const openAccessModal = async (exportId) => {
        setActiveExportId(exportId);
        setNewGrantEmail('');
        setShowAccessModal(true);
        setIsAccessLoading(true);
        try {
            const res = await fetch(`/nextapi/export/custom-export/${exportId}/access`);
            const data = await res.json();
            setExportAccess(data.success ? data.data : []);
        } catch (_) {
            setExportAccess([]);
        } finally {
            setIsAccessLoading(false);
        }
    };

    const closeAccessModal = () => {
        setShowAccessModal(false);
        setActiveExportId(null);
        setNewGrantEmail('');
    };

    const handleGrantAccess = async () => {
        if (!newGrantEmail.trim() || !activeExportId) return;
        setIsAccessLoading(true);
        try {
            const res = await fetch(`/nextapi/export/custom-export/${activeExportId}/access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newGrantEmail.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setNewGrantEmail('');
                setExportAccess(prev => [...prev, data.data]);
            }
        } catch (_) {}
        setIsAccessLoading(false);
    };

    const handleRevokeAccess = async (email) => {
        if (!activeExportId) return;
        try {
            await fetch(`/nextapi/export/custom-export/${activeExportId}/access/${encodeURIComponent(email)}`, { method: 'DELETE' });
            setExportAccess(prev => prev.filter(a => a.email !== email));
        } catch (_) {}
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
    const activeExportName = savedExports.find(e => e._id === activeExportId)?.name ?? '';

    const clearFilters = () => {
        setFilters({
            search: "",
            stockStatus: "all",
            minPrice: "",
            maxPrice: "",
            category: [],
            aiExportId: "all",
            aiCategory: [],
            imageFilter: "all",
            showNew: false,
            showRecommended: false,
            publishedOnly: false,
            excludeCloseOut: false,
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
                                Create and manage custom product exports
                            </p>
                        </div>
                    </div>

                    {/* Tab Switcher + Preview button on the same row */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-1 w-fit gap-1">
                            <button
                                onClick={() => setActiveTab("configure")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "configure"
                                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20"
                                        : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                Configure
                            </button>
                            <button
                                onClick={() => setActiveTab("saved")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "saved"
                                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/20"
                                        : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                Saved
                                {savedExports.length > 0 && (
                                    <span className={`px-1.5 py-0.5 text-[11px] rounded-full font-semibold ${activeTab === "saved" ? "bg-white/20 text-white" : "bg-cyan-500/20 text-cyan-400"}`}>
                                        {savedExports.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Preview button — lives in the header, always accessible */}
                        <button
                            onClick={() => { setPreviewConfig(null); setPreviewSearch(''); setShowPreview(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 hover:border-neutral-600/60 text-neutral-400 hover:text-white rounded-xl text-sm font-medium transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                            <span className="text-[11px] font-semibold tabular-nums px-1.5 py-0.5 bg-neutral-700/60 text-neutral-400 rounded-md">
                                {filteredProducts.length}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === "configure" ? (
                <div className="space-y-6">
                    {/* Step Indicator */}
                    {(() => {
                        const isInventory = selectedPreset === 'inventory';
                        const stepsOrder = isInventory ? ['format', 'filters', 'export'] : ['format', 'filters', 'fields', 'export'];
                        const currentIdx = stepsOrder.indexOf(exportStep);
                        const activeFilterCount = [
                            filters.search, filters.stockStatus !== 'all' && filters.stockStatus,
                            filters.minPrice, filters.maxPrice,
                            filters.category.length > 0 && 'cat',
                            filters.aiExportId !== 'all' && filters.aiExportId,
                            filters.aiCategory.length > 0 && 'aiCat',
                            filters.imageFilter !== 'all' && filters.imageFilter,
                            filters.showNew, filters.showRecommended, filters.publishedOnly, filters.excludeCloseOut,
                        ].filter(Boolean).length;
                        const ALL_STEPS = [
                            {
                                id: 'format', label: 'Format',
                                sub: currentPreset.name,
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
                            },
                            {
                                id: 'filters', label: 'Filters',
                                sub: activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} · ${filteredProducts.length} products` : `${filteredProducts.length} products`,
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
                            },
                            {
                                id: 'fields', label: 'Fields',
                                sub: selectedFields.length > 0 ? `${selectedFields.length} of ${currentPreset.fields.length} selected` : 'None selected',
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>,
                            },
                            {
                                id: 'export', label: 'Export',
                                sub: `${filteredProducts.length} products · ${totalRows} rows`,
                                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
                            },
                        ];
                        const STEP_META = ALL_STEPS.filter(s => stepsOrder.includes(s.id));
                        return (
                            <div className="bg-neutral-900/60 border border-neutral-700/50 rounded-2xl overflow-hidden">
                                <div className="flex divide-x divide-neutral-800">
                                    {STEP_META.map(({ id, label, sub, icon }, i) => {
                                        const thisIdx = stepsOrder.indexOf(id);
                                        const isDone = thisIdx < currentIdx;
                                        const isActive = id === exportStep;
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => setExportStep(id)}
                                                className={`relative flex-1 flex items-center gap-3 px-4 py-3.5 text-left transition-all min-w-0 ${
                                                    isActive ? 'bg-gradient-to-b from-cyan-950/60 to-transparent'
                                                    : isDone ? 'hover:bg-neutral-800/40 cursor-pointer'
                                                    : 'cursor-pointer hover:bg-neutral-800/20'
                                                }`}
                                            >
                                                {isActive && (
                                                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500" />
                                                )}
                                                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                                    isActive ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                                                    : isDone ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20'
                                                    : 'bg-neutral-800 text-neutral-600'
                                                }`}>
                                                    {isDone
                                                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                        : icon
                                                    }
                                                </div>
                                                <div className="min-w-0 hidden sm:block">
                                                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : isDone ? 'text-neutral-300' : 'text-neutral-600'}`}>{label}</p>
                                                    <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-cyan-400/70' : isDone ? 'text-neutral-500' : 'text-neutral-700'}`}>{sub}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Step 1: Format ──────────────────────────────────────────── */}
                    {exportStep === 'format' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Preset Cards */}
                            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50">
                                <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-5">Export Format</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(EXPORT_PRESETS).map(([key, preset]) => (
                                        <button
                                            key={key}
                                            onClick={() => handlePresetChange(key)}
                                            className={`flex flex-col items-start gap-3 p-5 rounded-2xl border transition-all duration-200 text-left ${selectedPreset === key
                                                ? 'bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                                                : 'bg-neutral-800/50 border-neutral-700/40 hover:bg-neutral-700/50 hover:border-neutral-600/60'
                                            }`}
                                        >
                                            <div className={`p-2.5 rounded-xl ${selectedPreset === key ? 'bg-cyan-500/20 text-cyan-400' : 'bg-neutral-700/50 text-neutral-400'}`}>
                                                {preset.icon}
                                            </div>
                                            <div>
                                                <div className={`font-semibold text-sm ${selectedPreset === key ? 'text-white' : 'text-neutral-300'}`}>{preset.name}</div>
                                                <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{preset.description}</div>
                                            </div>
                                            {selectedPreset === key && (
                                                <span className="text-xs text-cyan-400 font-medium">Selected ✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right column: Shopify Location (inventory) or Pricelist Priority (others) */}
                            {selectedPreset === 'inventory' ? (
                                <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden flex flex-col">
                                    <div className="px-6 py-5 border-b border-neutral-700/50">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <h2 className="text-sm font-semibold text-white">Shopify Location</h2>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1.5">Inventory column header in export</p>
                                    </div>
                                    <div className="p-5 flex flex-col gap-4 flex-1">
                                        <input
                                            type="text"
                                            value={inventoryLocationName}
                                            onChange={(e) => setInventoryLocationName(e.target.value)}
                                            placeholder="e.g. pATRIK"
                                            className="w-full px-4 py-2.5 bg-neutral-900/80 border border-neutral-700/50 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                                        />
                                        <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                            <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            <p className="text-xs text-amber-300/80 leading-relaxed">
                                                Must be an <strong className="text-amber-200">exact case-sensitive match</strong> of your Shopify location name.
                                                Find it in <strong className="text-amber-200">Settings &rarr; Locations</strong> in Shopify Admin.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : pricelistPriority.length > 0 ? (
                                <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden flex flex-col">
                                    <div className="px-6 py-5 border-b border-neutral-700/50">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                            </svg>
                                            <h2 className="text-sm font-semibold text-white">Pricelist Priority</h2>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1.5">Drag to reorder · First enabled pricelist wins</p>
                                    </div>
                                    <div className="p-4 flex-1">
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
                                                {dropIndicator === idx + 1 && draggedIndex !== idx && draggedIndex !== idx + 1 && (
                                                    <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-2 shadow-lg shadow-cyan-500/50 animate-pulse" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {pricelistPriority.filter(p => p.enabled).length === 0 && (
                                        <div className="px-5 py-3 bg-amber-500/10 border-t border-amber-500/20">
                                            <p className="text-xs text-amber-400">
                                                Enable at least one pricelist to export prices
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 flex items-center justify-center p-12">
                                    <div className="text-center">
                                        <svg className="w-10 h-10 text-neutral-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-neutral-600">No pricelists found in product data</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 2: Filters ──────────────────────────────────────────── */}
                    {exportStep === 'filters' && (
                        <div className="space-y-5">
                            {/* Unified filter card */}
                            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/50">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-sm font-semibold text-white">Filters</h2>
                                        {(() => {
                                            const n = [
                                                filters.stockStatus !== 'all' && filters.stockStatus,
                                                filters.minPrice, filters.maxPrice,
                                                filters.category !== 'all' && filters.category,
                                                filters.aiExportId !== 'all' && filters.aiExportId,
                                                filters.aiCategory !== 'all' && filters.aiCategory,
                                                filters.imageFilter !== 'all' && filters.imageFilter,
                                                filters.showNew, filters.showRecommended, filters.publishedOnly, filters.excludeCloseOut,
                                            ].filter(Boolean).length;
                                            return n > 0 ? (
                                                <span className="text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-medium">{n} active</span>
                                            ) : null;
                                        })()}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs tabular-nums">
                                            <span className="text-white font-semibold">{filteredProducts.length}</span>
                                            <span className="text-neutral-600"> / {initialProducts.length} products</span>
                                        </span>
                                        <button onClick={clearFilters} className="text-xs text-neutral-500 hover:text-red-400 transition-colors font-medium">Reset all</button>
                                    </div>
                                </div>

                                <div className="p-5 space-y-5">
                                    {/* Stock + Images */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Stock</p>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {[
                                                    { value: "all", label: "All", icon: "M4 6h16M4 10h16M4 14h8" },
                                                    { value: "in_stock", label: "In Stock", icon: "M5 13l4 4L19 7" },
                                                    { value: "out_of_stock", label: "No Stock", icon: "M6 18L18 6M6 6l12 12" },
                                                ].map(({ value, label, icon }) => (
                                                    <button key={value} onClick={() => setFilters(prev => ({ ...prev, stockStatus: value }))}
                                                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all ${filters.stockStatus === value ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10" : "bg-neutral-900/50 text-neutral-500 border border-neutral-700/40 hover:border-neutral-600 hover:text-neutral-300"}`}>
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Images</p>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {[
                                                    { value: "all", label: "All", icon: "M4 6h16M4 10h16M4 14h8" },
                                                    { value: "with_images", label: "Has Images", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
                                                    { value: "without_images", label: "No Images", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
                                                ].map(({ value, label, icon }) => (
                                                    <button key={value} onClick={() => setFilters(prev => ({ ...prev, imageFilter: value }))}
                                                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all ${filters.imageFilter === value ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10" : "bg-neutral-900/50 text-neutral-500 border border-neutral-700/40 hover:border-neutral-600 hover:text-neutral-300"}`}>
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price + Tags */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Price Range</p>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 text-xs font-mono">€</span>
                                                    <input type="number" value={filters.minPrice} onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))} placeholder="Min"
                                                        className="w-full pl-7 pr-3 py-2.5 bg-neutral-900/60 border border-neutral-700/40 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all" />
                                                </div>
                                                <span className="text-neutral-700 text-sm shrink-0">—</span>
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 text-xs font-mono">€</span>
                                                    <input type="number" value={filters.maxPrice} onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))} placeholder="Max"
                                                        className="w-full pl-7 pr-3 py-2.5 bg-neutral-900/60 border border-neutral-700/40 rounded-xl text-white text-sm placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">Tags</p>
                                            <div className="flex gap-1.5">
                                                {[
                                                    { key: "showNew", label: "New", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
                                                    { key: "showRecommended", label: "Recommended", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
                                                    { key: "publishedOnly", label: "Published", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
                                                    { key: "excludeCloseOut", label: "Excl. Close Out", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" },
                                                ].map(({ key, label, icon }) => (
                                                    <button key={key} onClick={() => setFilters(prev => ({ ...prev, [key]: !prev[key] }))}
                                                        className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all flex-1 justify-center ${filters[key] ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-neutral-900/50 text-neutral-500 border border-neutral-700/40 hover:border-neutral-600 hover:text-neutral-300"}`}>
                                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                                                        <span className="truncate">{label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        {/* Custom Categories Tree — full width */}
                        {availableAiExports.length > 0 && (
                            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden">
                                <div className="px-6 py-4 border-b border-neutral-700/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                            <h2 className="text-sm font-semibold text-white">Custom Categories</h2>
                                            {filters.aiCategory.length > 0 && (
                                                <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                                                    {filters.aiCategory.length === 1
                                                        ? filters.aiCategory[0].split(" / ").pop()
                                                        : `${filters.aiCategory.length} selected`}
                                                </span>
                                            )}
                                        </div>
                                        {filters.aiCategory.length > 0 && (
                                            <button
                                                onClick={() => setFilters(prev => ({ ...prev, aiCategory: [] }))}
                                                className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    {availableAiExports.length > 1 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {availableAiExports.map(exp => {
                                                const isActive = filters.aiExportId === exp.exportId;
                                                return (
                                                    <button
                                                        key={exp.exportId}
                                                        onClick={() => setFilters(prev => ({ ...prev, aiExportId: isActive ? "all" : exp.exportId, aiCategory: [] }))}
                                                        className={`flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium transition-all ${
                                                            isActive
                                                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                                                                : "bg-neutral-800/50 text-neutral-400 border border-neutral-700/50 hover:border-neutral-600 hover:text-white"
                                                        }`}
                                                    >
                                                        {exp.logo && <img src={exp.logo} alt="" className="w-3.5 h-3.5 object-contain rounded-sm" />}
                                                        {exp.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                {filters.aiExportId === "all" && availableAiExports.length > 1 ? (
                                    <div className="py-10 text-center text-neutral-500 text-sm">
                                        Select a category set above to browse categories
                                    </div>
                                ) : Object.keys(categoryTree).length === 0 ? (
                                    <div className="py-10 text-center text-neutral-500 text-sm">
                                        No custom categories found for this export
                                    </div>
                                ) : (
                                    <div className="p-3 overflow-y-auto max-h-[520px]">
                                        {(() => {
                                            const renderNodes = (nodes, depth) => Object.entries(nodes).map(([name, node]) => {
                                                const path = node._path;
                                                const hasChildren = Object.keys(node.children).length > 0;
                                                const isExpanded = expandedCategories.has(path);
                                                const isActive = filters.aiCategory.includes(path);
                                                const count = productCountByPrefix[path] || 0;
                                                return (
                                                    <div key={path}>
                                                        <div
                                                            className={`flex items-center gap-1 py-1.5 rounded-xl transition-all group ${
                                                                isActive ? "bg-purple-500/10" : "hover:bg-neutral-700/40"
                                                            } ${hasChildren ? "cursor-pointer" : "cursor-default"}`}
                                                            style={{ paddingLeft: `${8 + depth * 20}px`, paddingRight: "10px" }}
                                                            onClick={() => {
                                                                if (hasChildren) {
                                                                    setExpandedCategories(prev => {
                                                                        const next = new Set(prev);
                                                                        next.has(path) ? next.delete(path) : next.add(path);
                                                                        return next;
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            {/* Expand/collapse chevron */}
                                                            {hasChildren ? (
                                                                <span className="w-6 h-6 shrink-0 flex items-center justify-center text-neutral-500 group-hover:text-neutral-300">
                                                                    <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </span>
                                                            ) : (
                                                                <span className="w-6 shrink-0" />
                                                            )}
                                                            {/* Checkbox — always toggles selection, stops row expand propagation */}
                                                            <div
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setFilters(prev => ({ ...prev, aiCategory: isActive ? prev.aiCategory.filter(p => p !== path) : [...prev.aiCategory, path] }));
                                                                }}
                                                                className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-all mr-1 cursor-pointer ${
                                                                    isActive
                                                                        ? "bg-purple-500 border-purple-500"
                                                                        : "border-neutral-600 hover:border-purple-400 bg-transparent"
                                                                }`}
                                                            >
                                                                {isActive && (
                                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <span className={`text-sm flex-1 truncate select-none ${isActive ? "text-purple-300 font-medium" : "text-neutral-300 group-hover:text-white"}`}>{name}</span>
                                                            {count > 0 && (
                                                                <span className={`text-xs tabular-nums shrink-0 ml-1.5 ${isActive ? "text-purple-400/70" : "text-neutral-600 group-hover:text-neutral-500"}`}>
                                                                    {count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {hasChildren && isExpanded && renderNodes(node.children, depth + 1)}
                                                    </div>
                                                );
                                            });
                                            return renderNodes(categoryTree, 0);
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Product Category chips — dynamic, only categories still present after other filters */}
                        {availableCategories.length > 0 && (
                            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/50">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <h2 className="text-sm font-semibold text-white">Category</h2>
                                        {filters.category.length > 0 && (
                                            <span className="text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-medium">
                                                {filters.category.length === 1 ? filters.category[0] : `${filters.category.length} selected`}
                                            </span>
                                        )}
                                    </div>
                                    {filters.category.length > 0 && (
                                        <button onClick={() => setFilters(prev => ({ ...prev, category: [] }))}
                                            className="text-xs text-neutral-500 hover:text-red-400 transition-colors">Clear</button>
                                    )}
                                </div>
                                <div className="p-4 flex flex-wrap gap-1.5">
                                    {dynamicCategories.length === 0 ? (
                                        <span className="text-xs text-neutral-600 italic">No categories match current filters</span>
                                    ) : (
                                        dynamicCategories.map(cat => {
                                            const count = categoryProductCounts.get(cat) || 0;
                                            const isActive = filters.category.includes(cat);
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => setFilters(prev => ({ ...prev, category: isActive ? prev.category.filter(c => c !== cat) : [...prev.category, cat] }))}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                        isActive
                                                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                                            : "bg-neutral-900/50 text-neutral-500 border border-neutral-700/40 hover:border-neutral-600 hover:text-neutral-300"
                                                    }`}
                                                >
                                                    {cat}
                                                    <span className={`tabular-nums text-[10px] ${isActive ? "text-cyan-400/60" : "text-neutral-700"}`}>{count}</span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    )}

                    {/* ── Step 3: Fields ───────────────────────────────────────────── */}
                    {exportStep === 'fields' && (
                        <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-700/50">
                                <div>
                                    <h2 className="text-sm font-semibold text-white">Select Fields</h2>
                                    <p className="text-xs text-neutral-500 mt-0.5">Choose which columns to include in your export</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-neutral-500">{selectedFields.length} / {currentPreset.fields.flatMap((f) => f.group ? f.group.map(g => g.key) : [f.key]).length} selected</span>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setSelectedFields(currentPreset.fields.flatMap((f) => f.group ? f.group.map(g => g.key) : [f.key]))}
                                            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
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
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                                    {currentPreset.fields.filter(f => !AI_FIELD_KEYS.has(f.key) || (availableAiExports.length > 0 && filters.aiExportId !== "all")).map((field) => {
                                        const isSelected = field.group
                                            ? field.group.map((g) => g.key).every((k) => selectedFields.includes(k))
                                            : selectedFields.includes(field.key);
                                        return (
                                        <div key={field.key} className="relative group/field">
                                            <button
                                                onClick={() => toggleField(field)}
                                                className={`w-full flex items-center gap-2 px-3 py-2.5 pr-8 rounded-xl text-sm transition-all ${isSelected
                                                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-white"
                                                        : "bg-neutral-800/50 border border-neutral-700/30 text-neutral-400 hover:text-white hover:border-neutral-600"
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isSelected ? "bg-cyan-500" : "bg-neutral-700"}`}>
                                                    {isSelected && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="truncate">{field.label}</span>
                                            </button>
                                            {/* Info button */}
                                            <button
                                                onClick={e => { e.stopPropagation(); setFieldInfoModal(field); }}
                                                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center text-neutral-700 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all opacity-0 group-hover/field:opacity-100"
                                                title="Field details"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </button>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Export ───────────────────────────────────────────── */}
                    {exportStep === 'export' && (
                        <div className="space-y-6">
                            {/* Stats Bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-5 border border-neutral-700/50">
                                    <div className="text-3xl font-bold text-cyan-400">{filteredProducts.length}</div>
                                    <div className="text-xs text-neutral-500 mt-1">Products</div>
                                </div>
                                <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-5 border border-neutral-700/50">
                                    <div className="text-3xl font-bold text-blue-400">{totalRows}</div>
                                    <div className="text-xs text-neutral-500 mt-1">Export Rows</div>
                                </div>
                                <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-5 border border-neutral-700/50">
                                    <div className="text-3xl font-bold text-purple-400">{selectedPreset === 'inventory' ? 12 : selectedFields.length}</div>
                                    <div className="text-xs text-neutral-500 mt-1">{selectedPreset === 'inventory' ? 'Fixed Columns' : 'Fields'}</div>
                                </div>
                                <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-5 border border-neutral-700/50">
                                    {selectedPreset === 'inventory' ? (
                                        <>
                                            <div className="text-lg font-bold text-pink-400 truncate" title={inventoryLocationName || 'Not set'}>{inventoryLocationName || 'No location'}</div>
                                            <div className="text-xs text-neutral-500 mt-1">Location</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold text-pink-400">{currentPreset.name}</div>
                                            <div className="text-xs text-neutral-500 mt-1">Format</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Download */}
                            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/50">
                                    <div>
                                        <h2 className="text-sm font-semibold text-white">Download</h2>
                                        <p className="text-xs text-neutral-500 mt-0.5">{filteredProducts.length} products · {totalRows} rows{selectedPreset === 'inventory' ? ` · ${inventoryLocationName || 'No location'}` : ` · ${selectedFields.length} fields`}</p>
                                    </div>
                                    {exportStatus && (
                                        <span className={`text-sm font-medium px-3 py-1.5 rounded-lg ${exportStatus.includes("!") ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>
                                            {exportStatus}
                                        </span>
                                    )}
                                </div>
                                <div className={`p-4 grid gap-3 ${selectedPreset === 'inventory' ? 'grid-cols-1 max-w-xs' : 'grid-cols-3'}`}>
                                    {(selectedPreset === 'inventory' ? ['csv'] : ['csv', 'json', 'xml']).map((fmt) => {
                                        const meta = FORMAT_META[fmt];
                                        const isLoading = downloadingId === `current-${fmt}`;
                                        const disabled = (selectedPreset !== 'inventory' && selectedFields.length === 0) || filteredProducts.length === 0 || !!downloadingId;
                                        return (
                                            <button
                                                key={fmt}
                                                onClick={() => handleDownload(fmt)}
                                                disabled={disabled}
                                                className={`flex flex-col items-center gap-2.5 py-5 px-4 rounded-xl font-medium text-sm transition-all ${
                                                    disabled
                                                        ? 'bg-neutral-800/50 text-neutral-600 cursor-not-allowed'
                                                        : `${meta.bg} ${meta.text} hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] cursor-pointer`
                                                }`}
                                            >
                                                <div className="w-7 h-7 flex items-center justify-center">
                                                    {isLoading ? (
                                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                        </svg>
                                                    ) : meta.icon}
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-semibold">{meta.label}</div>
                                                    <div className="text-xs opacity-60 mt-0.5">{fmt === 'csv' ? 'Spreadsheet' : fmt === 'json' ? 'Structured data' : 'Markup'}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-white">Preview</h2>
                                    {filters.aiExportId !== "all" && filters.aiCategory.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                            {filters.aiCategory.length === 1 ? filters.aiCategory[0].split(" / ").map((part, i, arr) => (
                                                <span key={i} className="flex items-center gap-1">
                                                    {i > 0 && <span className="text-neutral-700">›</span>}
                                                    <span className={i === arr.length - 1 ? "text-purple-300 font-medium" : "text-neutral-600"}>{part}</span>
                                                </span>
                                            )) : <span className="text-purple-300 font-medium">{filters.aiCategory.length} categories</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Sub-category breakdown — clickable chips when a parent node is selected */}
                                {filters.aiExportId !== "all" && (() => {
                                    const prefix = filters.aiCategory.length === 1 ? filters.aiCategory[0] : null;
                                    const prefixDepth = prefix ? prefix.split(" / ").length : 0;
                                    const subCounts = new Map();

                                    filteredProducts.forEach(p => {
                                        const cat = p.ai_categories?.find(c => c.exportId === filters.aiExportId);
                                        if (!cat?.categoryName) return;
                                        let bucketPath;
                                        if (!prefix) {
                                            bucketPath = cat.categoryName.split(" / ")[0];
                                        } else if (cat.categoryName === prefix) {
                                            bucketPath = prefix;
                                        } else if (cat.categoryName.startsWith(prefix + " / ")) {
                                            const parts = cat.categoryName.split(" / ");
                                            bucketPath = parts.slice(0, prefixDepth + 1).join(" / ");
                                        } else {
                                            return;
                                        }
                                        subCounts.set(bucketPath, (subCounts.get(bucketPath) || 0) + 1);
                                    });

                                    if (subCounts.size <= 1) return null;

                                    const sorted = Array.from(subCounts.entries()).sort((a, b) => b[1] - a[1]);
                                    return (
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {sorted.map(([path, count]) => {
                                                const label = path.split(" / ").pop();
                                                const isActive = filters.aiCategory.includes(path);
                                                const isParentExact = prefix && path === prefix;
                                                return (
                                                    <button
                                                        key={path}
                                                        onClick={() => setFilters(prev => ({
                                                            ...prev,
                                                            aiCategory: isActive ? prev.aiCategory.filter(p => p !== path) : [...prev.aiCategory, path]
                                                        }))}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                                            isActive
                                                                ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                                                                : "bg-neutral-800/60 border-neutral-700/40 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/60 hover:border-neutral-600/50"
                                                        }`}
                                                    >
                                                        {isParentExact && <span className="text-neutral-600">·</span>}
                                                        <span>{label}</span>
                                                        <span className={`tabular-nums ${isActive ? "text-purple-400/70" : "text-neutral-600"}`}>{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}

                                <div className="overflow-x-auto rounded-xl border border-neutral-700/50">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-neutral-800/80">
                                                {/* AI Category column — shown when an export is selected */}
                                                {filters.aiExportId !== "all" && (
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-purple-400/70 uppercase tracking-wider whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                            </svg>
                                                            Category
                                                        </div>
                                                    </th>
                                                )}
                                                {currentPreset.fields
                                                    .filter((f) => selectedFields.includes(f.key))
                                                    .slice(0, filters.aiExportId !== "all" ? 4 : 5)
                                                    .map((field) => (
                                                        <th key={field.key} className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                                                            {field.label}
                                                        </th>
                                                    ))}
                                                {selectedFields.length > (filters.aiExportId !== "all" ? 4 : 5) && (
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">
                                                        +{selectedFields.length - (filters.aiExportId !== "all" ? 4 : 5)} more
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-700/50">
                                            {filteredProducts.slice(0, previewLimit).map((product, idx) => {
                                                const variant = product.child_products?.[0] || {};
                                                const priceInfo = getPriceFromPriority(variant);
                                                const aiCat = filters.aiExportId !== "all"
                                                    ? product.ai_categories?.find(c => c.exportId === filters.aiExportId)
                                                    : null;
                                                return (
                                                    <tr key={product._id || idx} className="hover:bg-neutral-700/20">
                                                        {/* AI Category breadcrumb cell */}
                                                        {filters.aiExportId !== "all" && (
                                                            <td className="px-4 py-3 whitespace-nowrap max-w-[200px]">
                                                                {aiCat?.categoryName ? (() => {
                                                                    const parts = aiCat.categoryName.split(" / ").map(p => p.trim());
                                                                    const selectedPrefix = Array.isArray(filters.aiCategory) && filters.aiCategory.length === 1
                                                                        ? filters.aiCategory[0]
                                                                        : (!Array.isArray(filters.aiCategory) && filters.aiCategory && filters.aiCategory !== "all" ? filters.aiCategory : null);
                                                                    const prefixParts = selectedPrefix ? selectedPrefix.split(" / ").map(p => p.trim()) : [];
                                                                    const deeperParts = parts.slice(prefixParts.length);

                                                                    if (!selectedPrefix) {
                                                                        // Show full path, leaf highlighted
                                                                        return (
                                                                            <div className="flex items-center gap-0.5 flex-wrap">
                                                                                {parts.map((p, i) => (
                                                                                    <span key={i} className="flex items-center gap-0.5">
                                                                                        {i > 0 && <span className="text-neutral-700 text-xs">›</span>}
                                                                                        <span className={`text-xs ${i === parts.length - 1 ? "text-neutral-200" : "text-neutral-500"}`}>{p}</span>
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    }

                                                                    if (deeperParts.length === 0) {
                                                                        // Product is exactly at the selected node
                                                                        return <span className="text-xs text-purple-300 font-medium">{parts[parts.length - 1]}</span>;
                                                                    }

                                                                    // Prefix dimmed, deeper path highlighted
                                                                    return (
                                                                        <div className="flex items-center gap-0.5 flex-wrap">
                                                                            {prefixParts.map((p, i) => (
                                                                                <span key={`pre-${i}`} className="flex items-center gap-0.5">
                                                                                    {i > 0 && <span className="text-neutral-800 text-xs">›</span>}
                                                                                    <span className="text-xs text-neutral-700">{p}</span>
                                                                                </span>
                                                                            ))}
                                                                            {deeperParts.map((p, i) => (
                                                                                <span key={`deep-${i}`} className="flex items-center gap-0.5">
                                                                                    <span className="text-neutral-600 text-xs">›</span>
                                                                                    <span className={`text-xs ${i === deeperParts.length - 1 ? "text-purple-300 font-semibold" : "text-neutral-400"}`}>{p}</span>
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                })() : (
                                                                    <span className="text-neutral-700 text-xs">—</span>
                                                                )}
                                                            </td>
                                                        )}
                                                        {currentPreset.fields
                                                            .filter((f) => selectedFields.includes(f.key))
                                                            .slice(0, filters.aiExportId !== "all" ? 4 : 5)
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
                                                        {selectedFields.length > (filters.aiExportId !== "all" ? 4 : 5) && (
                                                            <td className="px-4 py-3 text-neutral-600">...</td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                            {filteredProducts.length === 0 && (
                                                <tr>
                                                    <td colSpan={Math.min(selectedFields.length + (filters.aiExportId !== "all" ? 1 : 0), 6) || 1} className="px-4 py-12 text-center text-neutral-500">
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
                    )}

                    {/* Bottom Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-800/60">
                        <button
                            onClick={() => {
                                const steps = selectedPreset === 'inventory' ? ['format', 'filters', 'export'] : ['format', 'filters', 'fields', 'export'];
                                const idx = steps.indexOf(exportStep);
                                if (idx > 0) setExportStep(steps[idx - 1]);
                            }}
                            disabled={exportStep === 'format'}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-0 disabled:pointer-events-none bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 hover:text-white border border-neutral-700/50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>

                        {exportStep !== 'export' ? (
                            <button
                                onClick={() => {
                                    const steps = selectedPreset === 'inventory' ? ['format', 'filters', 'export'] : ['format', 'filters', 'fields', 'export'];
                                    const idx = steps.indexOf(exportStep);
                                    if (idx < steps.length - 1) setExportStep(steps[idx + 1]);
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-md shadow-cyan-500/20"
                            >
                                {exportStep === 'format' && 'Set Filters'}
                                {exportStep === 'filters' && selectedPreset === 'inventory' ? 'Review & Export' : ''}
                                {exportStep === 'filters' && selectedPreset !== 'inventory' ? 'Choose Fields' : ''}
                                {exportStep === 'fields' && 'Review & Export'}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowSaveModal(true)}
                                disabled={selectedPreset !== 'inventory' && selectedFields.length === 0}
                                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-800/50 disabled:cursor-not-allowed border border-neutral-700 hover:border-neutral-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm"
                            >
                                <SaveIcon /> Save Config
                            </button>
                        )}
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
                        <div className="bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-700/50 py-20 px-8">
                            <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-700/50 shadow-xl">
                                        <svg className="w-9 h-9 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">No saved exports yet</h3>
                                <p className="text-sm text-neutral-500 mb-6 leading-relaxed">Configure an export with your preferred settings, then save it for quick access and shareable API links.</p>
                                <button
                                    onClick={() => setActiveTab("configure")}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25 text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Your First Export
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {savedExports.map((config) => {
                                const PRESET_STYLE = {
                                    shopify: { gradient: 'from-emerald-500 to-green-400', badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20', iconBg: 'bg-emerald-500/15 text-emerald-400' },
                                    simple:  { gradient: 'from-cyan-500 to-blue-400',    badge: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',       iconBg: 'bg-cyan-500/15 text-cyan-400' },
                                    detailed:{ gradient: 'from-violet-500 to-purple-400', badge: 'bg-violet-500/15 text-violet-400 border border-violet-500/20', iconBg: 'bg-violet-500/15 text-violet-400' },
                                    inventory:{ gradient: 'from-amber-500 to-orange-400', badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',   iconBg: 'bg-amber-500/15 text-amber-400' },
                                };
                                const style = PRESET_STYLE[config.preset] || PRESET_STYLE.simple;
                                const preset = EXPORT_PRESETS[config.preset];

                                // Count active filters (backwards-compatible: handles legacy string or new array)
                                const f = config.filters || {};
                                const fCats = Array.isArray(f.category) ? f.category : (f.category && f.category !== 'all' ? [f.category] : []);
                                const fAiCats = Array.isArray(f.aiCategory) ? f.aiCategory : (f.aiCategory && f.aiCategory !== 'all' ? [f.aiCategory] : []);
                                const activeFilterCount = [
                                    f.search, f.stockStatus !== 'all' && f.stockStatus,
                                    f.minPrice, f.maxPrice,
                                    fCats.length > 0 && 'cat',
                                    f.aiExportId !== 'all' && f.aiExportId,
                                    fAiCats.length > 0 && 'aiCat',
                                    f.imageFilter !== 'all' && f.imageFilter,
                                    f.showNew, f.showRecommended, f.publishedOnly, f.excludeCloseOut,
                                ].filter(Boolean).length;

                                return (
                                <div
                                    key={config._id}
                                    className="group relative bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 rounded-2xl overflow-hidden hover:border-neutral-500/60 hover:shadow-xl hover:shadow-black/30 transition-all duration-200"
                                >
                                    {/* Top gradient accent bar */}
                                    <div className={`h-[3px] bg-gradient-to-r ${style.gradient}`} />

                                    {/* Card body */}
                                    <div className="p-5">
                                        {/* Header row: icon + title + preset badge */}
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}>
                                                {preset?.icon || (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-white truncate text-base leading-tight">{config.name}</h3>
                                                {config.description ? (
                                                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">{config.description}</p>
                                                ) : (
                                                    <p className="text-xs text-neutral-600 mt-0.5 italic">No description</p>
                                                )}
                                            </div>
                                            <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide ${style.badge}`}>
                                                {preset?.name || config.preset}
                                            </span>
                                        </div>

                                        {/* Stats chips */}
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700/50 text-xs text-neutral-400">
                                                <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h8" />
                                                </svg>
                                                <span className="font-medium text-neutral-300">{config.selectedFields?.length || 0}</span> fields
                                            </span>
                                            {activeFilterCount > 0 && (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400">
                                                    <FilterIcon />
                                                    <span className="font-medium">{activeFilterCount}</span> filter{activeFilterCount !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {(config.pricelistPriority?.filter(p => p.enabled).length ?? 0) > 0 && (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700/50 text-xs text-neutral-400">
                                                    <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-medium text-neutral-300">{config.pricelistPriority.filter(p => p.enabled).length}</span> pricelist{config.pricelistPriority.filter(p => p.enabled).length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700/50 text-xs text-neutral-500 ml-auto">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {formatDate(config.createdAt)}
                                            </span>
                                        </div>

                                        {/* Download section */}
                                        <div className="mb-3">
                                            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-2">Download</p>
                                            <div className={`grid gap-1.5 ${config.preset === 'inventory' ? 'grid-cols-1 max-w-[120px]' : 'grid-cols-3'}`}>
                                                {(config.preset === 'inventory' ? ['csv'] : ['csv', 'json', 'xml']).map((fmt) => {
                                                    const meta = FORMAT_META[fmt];
                                                    const dlKey = `${config._id}-${fmt}`;
                                                    const isLoading = downloadingId === dlKey;
                                                    return (
                                                        <button
                                                            key={fmt}
                                                            onClick={() => downloadFromAPI(config._id, fmt)}
                                                            disabled={!!downloadingId}
                                                            title={`Download as ${meta.label}`}
                                                            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                                                isLoading
                                                                    ? 'bg-neutral-800 text-neutral-500 cursor-wait'
                                                                    : `${meta.bg} ${meta.text} disabled:opacity-40 disabled:cursor-not-allowed`
                                                            }`}
                                                        >
                                                            {isLoading ? <SpinnerIcon /> : meta.icon}
                                                            {meta.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card footer */}
                                    <div className="border-t border-neutral-700/40 px-4 py-3 flex items-center gap-2 bg-neutral-900/30">
                                        <button
                                            onClick={() => loadExportConfig(config)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 rounded-xl text-xs font-semibold transition-colors border border-cyan-500/20"
                                        >
                                            <LoadIcon />
                                            Load Config
                                        </button>
                                        <button
                                            onClick={() => { setPreviewConfig(config); setPreviewSearch(''); setShowPreview(true); }}
                                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300 rounded-xl text-xs font-semibold transition-colors border border-neutral-600/30"
                                            title="Preview products for this export"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Preview
                                        </button>
                                        <button
                                            onClick={() => openKeysModal(config._id)}
                                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl text-xs font-semibold transition-colors border border-purple-500/20"
                                            title="API Keys"
                                        >
                                            <KeyIcon />
                                            Keys
                                        </button>
                                        <button
                                            onClick={() => openAccessModal(config._id)}
                                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-xs font-semibold transition-colors border border-blue-500/20"
                                            title="Manage access"
                                        >
                                            <UsersIcon />
                                            Access
                                        </button>
                                        <button
                                            onClick={() => deleteExport(config._id)}
                                            className="flex items-center justify-center py-2 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/20"
                                            title="Delete export"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Product Preview Panel */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex" style={{ fontFamily: 'inherit' }}>
                    {/* Backdrop */}
                    <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
                    {/* Drawer */}
                    <div className="w-full max-w-4xl bg-neutral-950 border-l border-neutral-700/60 flex flex-col shadow-2xl overflow-hidden">
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/80 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base font-semibold text-white truncate">
                                        {previewConfig ? previewConfig.name : 'Current Export Preview'}
                                    </h2>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        <span className="text-cyan-400 font-medium">{previewDisplayProducts.length}</span>
                                        {previewSearch.trim() ? ` of ${previewBaseProducts.length} products` : ` product${previewBaseProducts.length !== 1 ? 's' : ''}`} match this export
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {/* Grid / List toggle */}
                                <div className="flex bg-neutral-800/80 border border-neutral-700/50 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setPreviewView('grid')}
                                        className={`p-1.5 rounded-md transition-all ${previewView === 'grid' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                                        title="Grid view"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setPreviewView('list')}
                                        className={`p-1.5 rounded-md transition-all ${previewView === 'list' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                                        title="List view"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Search bar */}
                        <div className="px-4 py-3 border-b border-neutral-800/60 shrink-0">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={previewSearch}
                                    onChange={e => setPreviewSearch(e.target.value)}
                                    placeholder="Search within preview..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-neutral-800/60 border border-neutral-700/40 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                                />
                                {previewSearch && (
                                    <button onClick={() => setPreviewSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Product list */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {previewDisplayProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-neutral-600">
                                    <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-sm font-medium">{previewSearch ? 'No products match your search' : 'No products match this export'}</p>
                                </div>
                            ) : previewView === 'grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {previewDisplayProducts.map((product) => {
                                        const imgSrc = product.images?.[0] || product.child_products?.find(v => v.images?.[0])?.images?.[0];
                                        const variants = product.child_products || [];
                                        const allPrices = variants.flatMap(v => v.pricelist?.map(p => p.price).filter(p => typeof p === 'number') || []);
                                        const minPrice = allPrices.length ? Math.min(...allPrices) : null;
                                        const hasStock = variants.some(v => v.stock_amount > 0);
                                        return (
                                            <div key={product._id || product.token} className="group bg-neutral-900/70 border border-neutral-800/60 rounded-xl overflow-hidden hover:border-neutral-600/60 hover:shadow-lg hover:shadow-black/30 transition-all">
                                                <div className="relative aspect-square bg-neutral-800">
                                                    {imgSrc ? (
                                                        <img src={imgSrc} alt={product.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <svg className="w-10 h-10 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${hasStock ? 'bg-emerald-500/90 text-white' : 'bg-neutral-700/90 text-neutral-400'}`}>
                                                            {hasStock ? '● In Stock' : '○ No Stock'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-2.5">
                                                    <p className="text-xs font-semibold text-white line-clamp-2 leading-snug mb-1.5">{product.product_name}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] text-neutral-500">{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
                                                        {minPrice !== null && <span className="text-xs font-semibold text-cyan-400">€{minPrice.toFixed(2)}</span>}
                                                    </div>
                                                    {product.categories?.length > 0 && (
                                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                                            {product.categories.slice(0, 2).map(cat => (
                                                                <span key={cat} className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-500 rounded-md border border-neutral-700/50 truncate max-w-[80px]">{cat}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {previewDisplayProducts.map((product) => {
                                        const imgSrc = product.images?.[0] || product.child_products?.find(v => v.images?.[0])?.images?.[0];
                                        const variants = product.child_products || [];
                                        const allPrices = variants.flatMap(v => v.pricelist?.map(p => p.price).filter(p => typeof p === 'number') || []);
                                        const minPrice = allPrices.length ? Math.min(...allPrices) : null;
                                        const hasStock = variants.some(v => v.stock_amount > 0);
                                        return (
                                            <div key={product._id || product.token} className="flex items-center gap-3 p-2.5 bg-neutral-900/60 border border-neutral-800/50 rounded-xl hover:border-neutral-700/60 hover:bg-neutral-800/40 transition-all group">
                                                <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-neutral-800">
                                                    {imgSrc ? (
                                                        <img src={imgSrc} alt={product.product_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{product.product_name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[11px] text-neutral-600">{variants.length} var.</span>
                                                        {minPrice !== null && <span className="text-[11px] font-semibold text-cyan-400">€{minPrice.toFixed(2)}</span>}
                                                        {product.categories?.slice(0, 2).map(cat => (
                                                            <span key={cat} className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-600 rounded border border-neutral-700/40 truncate max-w-[100px]">{cat}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${hasStock ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-600 border border-neutral-700/40'}`}>
                                                        {hasStock ? 'In Stock' : 'No Stock'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Field Info Modal */}
            {fieldInfoModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setFieldInfoModal(null)}>
                    <div className="bg-neutral-900 rounded-2xl w-full max-w-md border border-neutral-700/60 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                        <div className="p-6 space-y-5">

                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5">
                                    <h3 className="text-base font-semibold text-white">{fieldInfoModal.label}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Column</span>
                                        <code className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md font-mono border border-cyan-500/15">{fieldInfoModal.label}</code>
                                    </div>
                                </div>
                                <button onClick={() => setFieldInfoModal(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-all shrink-0 mt-0.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* AI source notice */}
                            {AI_FIELD_KEYS.has(fieldInfoModal.key) && fieldInfoModal.key !== "ai_export_ids" && (
                                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple-500/[0.07] border border-purple-500/20">
                                    <svg className="w-3.5 h-3.5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                    <p className="text-xs text-neutral-400">
                                        Populated by <span className="text-purple-300 font-medium">Gemini AI</span> based on your export's custom category tree
                                        {fieldInfoModal.key === "ai_tags" && <> · used as <span className="text-white font-medium">Collection</span> in Shopify</>}
                                    </p>
                                </div>
                            )}

                            {/* Description — only for non-Collection fields (Collection gets the toggle instead) */}
                            {fieldInfoModal.description && fieldInfoModal.key !== "ai_tags" && fieldInfoModal.key !== "ai_category_names" && (
                                <p className="text-sm text-neutral-400 leading-relaxed">{fieldInfoModal.description}</p>
                            )}

                            {/* Output format toggle — Collection fields only */}
                            {(fieldInfoModal.key === "ai_tags" || fieldInfoModal.key === "ai_category_names") && (
                                <div className="space-y-2.5">
                                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Output format</p>
                                    <div className="space-y-2">
                                        {[
                                            {
                                                leaf: true,
                                                title: "Category name",
                                                subtitle: "Last segment of the path",
                                                example: "Phones",
                                                isDefault: fieldInfoModal.key === "ai_tags",
                                                defaultLabel: "Shopify default",
                                            },
                                            {
                                                leaf: false,
                                                title: "Full hierarchy",
                                                subtitle: "Complete path including parents",
                                                example: "Electronics / Phones",
                                                isDefault: fieldInfoModal.key === "ai_category_names",
                                                defaultLabel: "Default",
                                            },
                                        ].map(opt => {
                                            const active = aiLeafMode[fieldInfoModal.key] === opt.leaf;
                                            return (
                                                <button key={String(opt.leaf)} onClick={() => setAiLeafMode(prev => ({ ...prev, [fieldInfoModal.key]: opt.leaf }))}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${active ? "bg-cyan-500/10 border-cyan-500/40" : "bg-neutral-800/40 border-neutral-700/40 hover:border-neutral-600/60"}`}>
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${active ? "border-cyan-500" : "border-neutral-600"}`}>
                                                        {active && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-medium ${active ? "text-white" : "text-neutral-400"}`}>{opt.title}</span>
                                                            {opt.isDefault && <span className="text-[10px] text-neutral-500 bg-neutral-700/60 px-1.5 py-0.5 rounded-md">{opt.defaultLabel}</span>}
                                                        </div>
                                                        <p className="text-xs text-neutral-600 mt-0.5">{opt.subtitle}</p>
                                                    </div>
                                                    <code className={`text-[11px] font-mono px-2 py-1 rounded-lg shrink-0 ${active ? "text-cyan-300 bg-cyan-500/10 border border-cyan-500/20" : "text-neutral-500 bg-neutral-800 border border-neutral-700/50"}`}>{opt.example}</code>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
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

            {/* API Keys Modal */}
            {showKeysModal && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 rounded-2xl w-full max-w-lg border border-neutral-700/60 max-h-[90vh] flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-500/15 rounded-lg flex items-center justify-center ring-1 ring-purple-500/20">
                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-sm">API Keys</h3>
                                    {activeExportName && <p className="text-xs text-neutral-500 truncate max-w-[220px]">{activeExportName}</p>}
                                </div>
                            </div>
                            <button onClick={closeKeysModal} className="text-neutral-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-neutral-800">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-5 space-y-5">
                            {/* ── New key — one-time display ── */}
                            {createdKeyRaw && (
                                <div className="rounded-xl border border-amber-500/20 overflow-hidden">
                                    {/* Warning strip */}
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/8 border-b border-amber-500/15">
                                        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <p className="text-amber-400 font-medium text-xs">Save this key — it won&apos;t be shown again</p>
                                    </div>
                                    {/* Tab strip */}
                                    <div className="flex border-b border-neutral-800 bg-neutral-900/60">
                                        {[['key', 'Key'], ['endpoints', 'Endpoints'], ['usage', 'Usage']].map(([id, label]) => (
                                            <button key={id} onClick={() => setCreatedKeyTab(id)}
                                                className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${createdKeyTab === id ? 'border-purple-500 text-purple-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Tab content */}
                                    <div className="p-4 bg-neutral-950/40">
                                        {createdKeyTab === 'key' && (
                                            <div className="flex gap-2">
                                                <code className="flex-1 text-xs text-white bg-neutral-900 px-3 py-2.5 rounded-lg break-all font-mono min-w-0 border border-neutral-800">{createdKeyRaw}</code>
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(createdKeyRaw); setCopiedField('key'); setTimeout(() => setCopiedField(null), 2000); }}
                                                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${copiedField === 'key' ? 'bg-green-500/15 text-green-400 ring-1 ring-green-500/20' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}
                                                >
                                                    {copiedField === 'key' ? '✓ Copied' : 'Copy'}
                                                </button>
                                            </div>
                                        )}
                                        {createdKeyTab === 'endpoints' && (
                                            <div className="space-y-2">
                                                {[['CSV', 'csv', 'text-cyan-400'], ['JSON', 'json', 'text-emerald-400'], ['XML', 'xml', 'text-orange-400']].map(([label, fmt, color]) => (
                                                    <div key={fmt} className="flex items-center gap-2">
                                                        <span className={`text-xs font-mono font-semibold w-9 shrink-0 ${color}`}>{label}</span>
                                                        <code className="flex-1 text-xs text-neutral-300 bg-neutral-900 px-2.5 py-2 rounded-lg font-mono min-w-0 truncate border border-neutral-800">
                                                            {`${apiUrl}/custom-export/${activeExportId}/${fmt}`}
                                                        </code>
                                                        <button
                                                            onClick={() => { navigator.clipboard.writeText(`${apiUrl}/custom-export/${activeExportId}/${fmt}`); setCopiedField(fmt); setTimeout(() => setCopiedField(null), 2000); }}
                                                            className={`shrink-0 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${copiedField === fmt ? 'bg-green-500/15 text-green-400 ring-1 ring-green-500/20' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}
                                                        >
                                                            {copiedField === fmt ? '✓' : 'Copy'}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {createdKeyTab === 'usage' && (
                                            <div className="space-y-3">
                                                <p className="text-xs text-neutral-400">Send the key in the <code className="text-purple-400 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">X-Api-Key</code> header — never in the URL.</p>
                                                {[['csv', 'text-cyan-400'], ['json', 'text-emerald-400'], ['xml', 'text-orange-400']].map(([fmt, color]) => (
                                                    <div key={fmt}>
                                                        <p className={`text-xs font-mono font-semibold mb-1 ${color}`}>{fmt.toUpperCase()}</p>
                                                        <div className="relative">
                                                            <code className="block text-xs text-green-400 bg-black/60 border border-neutral-800 px-3 py-2.5 rounded-lg font-mono break-all leading-relaxed">
                                                                {`curl -H "X-Api-Key: ${createdKeyRaw}" \\\n  ${apiUrl}/custom-export/${activeExportId}/${fmt}`}
                                                            </code>
                                                            <button
                                                                onClick={() => { navigator.clipboard.writeText(`curl -H "X-Api-Key: ${createdKeyRaw}" \\\n  ${apiUrl}/custom-export/${activeExportId}/${fmt}`); setCopiedField(`curl-${fmt}`); setTimeout(() => setCopiedField(null), 2000); }}
                                                                className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium transition-colors ${copiedField === `curl-${fmt}` ? 'bg-green-500/15 text-green-400' : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400'}`}
                                                            >
                                                                {copiedField === `curl-${fmt}` ? '✓' : 'Copy'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Create new key ── */}
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">New key</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                                        placeholder="e.g. Shopify Integration"
                                        className="flex-1 px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/60 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 text-sm transition-colors"
                                    />
                                    <button
                                        onClick={handleCreateKey}
                                        disabled={isKeyLoading || !newKeyName.trim()}
                                        className="px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-purple-400 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ring-1 ring-purple-500/20"
                                    >
                                        {isKeyLoading ? (
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        )}
                                        Generate
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-neutral-800" />

                            {/* ── Key list ── */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Keys</p>
                                    {exportKeys.filter(k => k.isActive).length > 0 && (
                                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full ring-1 ring-purple-500/15">
                                            {exportKeys.filter(k => k.isActive).length} active
                                        </span>
                                    )}
                                </div>
                                {isKeyLoading ? (
                                    <div className="flex items-center justify-center py-10 text-neutral-600 text-sm gap-2">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Loading...
                                    </div>
                                ) : exportKeys.length === 0 ? (
                                    <div className="text-center py-10 text-neutral-600">
                                        <svg className="w-7 h-7 mx-auto mb-2.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                        <p className="text-sm font-medium">No API keys yet</p>
                                        <p className="text-xs text-neutral-700 mt-1">Generate one above to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {exportKeys.map(key => (
                                            <div key={key.keyId} className={`rounded-xl border transition-all ${key.isActive ? 'bg-neutral-800/40 border-neutral-700/50' : 'bg-neutral-800/10 border-neutral-800/40 opacity-40'}`}>
                                                {/* Key row */}
                                                <div className="flex items-center gap-2 p-3">
                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${key.isActive ? 'bg-green-500' : 'bg-neutral-600'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate leading-tight">{key.name}</p>
                                                        <p className="text-xs text-neutral-500 font-mono leading-tight">{key.keyPrefix}···</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {key.isActive && (
                                                            <button
                                                                onClick={() => setExpandedKeyId(expandedKeyId === key.keyId ? null : key.keyId)}
                                                                title="Show endpoints"
                                                                className={`p-1.5 rounded-lg text-xs transition-colors ${expandedKeyId === key.keyId ? 'bg-purple-500/20 text-purple-400' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50'}`}
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {key.isActive ? (
                                                            <button
                                                                onClick={() => handleRevokeKey(key.keyId)}
                                                                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                                                            >
                                                                Revoke
                                                            </button>
                                                        ) : (
                                                            <span className="px-2.5 py-1 bg-neutral-800 text-neutral-600 rounded-lg text-xs">Revoked</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Expandable endpoints panel */}
                                                {expandedKeyId === key.keyId && (
                                                    <div className="px-3 pb-3 space-y-2 border-t border-neutral-700/40 pt-3">
                                                        <p className="text-xs text-neutral-500 mb-2">
                                                            Set header <code className="text-purple-400 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">X-Api-Key: &lt;your-key&gt;</code>
                                                        </p>
                                                        {[['CSV', 'csv', 'text-cyan-400'], ['JSON', 'json', 'text-emerald-400'], ['XML', 'xml', 'text-orange-400']].map(([label, fmt, color]) => (
                                                            <div key={fmt} className="flex items-center gap-2">
                                                                <span className={`text-xs font-mono font-semibold w-9 shrink-0 ${color}`}>{label}</span>
                                                                <code className="flex-1 text-xs text-neutral-400 bg-neutral-900/80 px-2.5 py-1.5 rounded-lg font-mono min-w-0 truncate border border-neutral-800">
                                                                    {`${apiUrl}/custom-export/${activeExportId}/${fmt}`}
                                                                </code>
                                                                <button
                                                                    onClick={() => { navigator.clipboard.writeText(`${apiUrl}/custom-export/${activeExportId}/${fmt}`); setCopiedField(`${key.keyId}-${fmt}`); setTimeout(() => setCopiedField(null), 2000); }}
                                                                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${copiedField === `${key.keyId}-${fmt}` ? 'bg-green-500/15 text-green-400 ring-1 ring-green-500/20' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'}`}
                                                                >
                                                                    {copiedField === `${key.keyId}-${fmt}` ? '✓' : 'Copy'}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Timestamps */}
                                                <p className="text-xs text-neutral-700 px-3 pb-2.5">
                                                    Created {formatDate(key.createdAt)}
                                                    {key.lastUsedAt && <span className="ml-2.5">· Last used {formatDate(key.lastUsedAt)}</span>}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Access Control Modal */}
            {showAccessModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-800 rounded-2xl w-full max-w-lg border border-neutral-700 max-h-[90vh] flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-sm">Access Control</h3>
                                    {activeExportName && <p className="text-xs text-neutral-500 truncate max-w-[220px]">{activeExportName}</p>}
                                </div>
                            </div>
                            <button onClick={closeAccessModal} className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-700/50">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-6 space-y-5">
                            {/* Grant access */}
                            <div>
                                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Grant Access</p>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={newGrantEmail}
                                        onChange={(e) => setNewGrantEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGrantAccess()}
                                        placeholder="user@example.com"
                                        className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                                    />
                                    <button
                                        onClick={handleGrantAccess}
                                        disabled={isAccessLoading || !newGrantEmail.trim()}
                                        className="px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-blue-400 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Grant
                                    </button>
                                </div>
                                <p className="text-xs text-neutral-600 mt-1.5">User must also have the export role in Auth0.</p>
                            </div>

                            <div className="border-t border-neutral-700/50" />

                            {/* Access list */}
                            <div>
                                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                                    Users with Access
                                    {exportAccess.length > 0 && (
                                        <span className="ml-2 text-blue-400 normal-case font-normal tracking-normal">
                                            {exportAccess.length} {exportAccess.length === 1 ? 'user' : 'users'}
                                        </span>
                                    )}
                                </p>
                                {isAccessLoading ? (
                                    <div className="flex items-center justify-center py-8 text-neutral-500 text-sm gap-2">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Loading...
                                    </div>
                                ) : exportAccess.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-600">
                                        <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <p className="text-sm">No access grants yet</p>
                                        <p className="text-xs text-neutral-700 mt-1">Enter an email above to grant access</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {exportAccess.map(entry => {
                                            const initials = entry.email.split('@')[0].slice(0, 2).toUpperCase();
                                            return (
                                                <div key={entry.email} className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-xl border border-neutral-700/50">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                                                        <span className="text-xs font-semibold text-blue-400">{initials}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{entry.email}</p>
                                                        <p className="text-xs text-neutral-500">
                                                            Granted {formatDate(entry.grantedAt)}
                                                            {' · '}
                                                            <span className={entry.sub ? 'text-green-500' : 'text-neutral-600'}>
                                                                {entry.sub ? 'Active' : 'Pending login'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRevokeAccess(entry.email)}
                                                        className="shrink-0 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                                                    >
                                                        Revoke
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
