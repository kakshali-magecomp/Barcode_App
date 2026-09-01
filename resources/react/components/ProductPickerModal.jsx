import React, { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

const PLACEHOLDER_IMAGE =
  "https://cdn.shopify.com/static/images/admin/placeholder.png";

export default function ProductPickerModal({
  open,
  onClose,
  onSelect,
  alreadySelectedIds = [],
}) {
  const shopify = useAppBridge();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariantIds, setSelectedVariantIds] = useState([]);
  const [currencyCode, setCurrencyCode] = useState("USD");

  useEffect(() => {
    if (!open) return;

    // Pre-populate already selected variant IDs
    setSelectedVariantIds(alreadySelectedIds.map(id => String(id)));
    setSearchQuery("");

    // Attempt shopify.resourcePicker if available in Shopify App Bridge
    if (shopify && typeof shopify.resourcePicker === 'function') {
      shopify.resourcePicker({
        type: 'product',
        multiple: true,
        action: 'select',
      }).then((selection) => {
        if (selection && Array.isArray(selection) && selection.length > 0) {
          const formatted = [];
          selection.forEach(p => {
            const pId = p.id ? String(p.id).split('/').pop() : '';
            (p.variants || []).forEach(v => {
              const vId = v.id ? String(v.id).split('/').pop() : '';
              formatted.push({
                variant_id: vId,
                product_id: pId,
                product_title: p.title,
                variant_title: v.title === 'Default Title' ? '' : v.title,
                sku: v.sku || '',
                current_sku: v.sku || '',
                barcode: v.barcode || '',
                price: v.price || '0.00',
                image: v.image?.src || p.images?.[0]?.src || PLACEHOLDER_IMAGE,
                available: v.inventoryQuantity ?? 0,
                inventory_quantity: v.inventoryQuantity ?? 0,
                vendor: p.vendor || ''
              });
            });
          });
          if (formatted.length > 0) {
            onSelect(formatted);
            onClose();
            return;
          }
        }
      }).catch(() => {
        // Fallback to local modal if native picker is cancelled or unsupported
      });
    }

    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        const json = await res.json();
        if (json.status && Array.isArray(json.variants)) {
          setProducts(json.variants);
        }
        if (json.currency_code) {
          setCurrencyCode(json.currency_code);
        }
      } catch (err) {
        console.error("Failed to load products in picker modal:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [open, alreadySelectedIds, shopify]);

  if (!open) return null;

  // Filter products by search query
  const filteredProducts = products.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.product_title && item.product_title.toLowerCase().includes(q)) ||
      (item.variant_title && item.variant_title.toLowerCase().includes(q)) ||
      (item.current_sku && String(item.current_sku).toLowerCase().includes(q)) ||
      (item.sku && String(item.sku).toLowerCase().includes(q)) ||
      (item.barcode && String(item.barcode).toLowerCase().includes(q)) ||
      (item.vendor && item.vendor.toLowerCase().includes(q))
    );
  });

  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedVariantIds.includes(String(p.variant_id)));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all currently filtered products
      const filteredIds = new Set(filteredProducts.map((p) => String(p.variant_id)));
      setSelectedVariantIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all currently filtered products
      const filteredIds = filteredProducts.map((p) => String(p.variant_id));
      setSelectedVariantIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const toggleSelectOne = (variantId) => {
    const vIdStr = String(variantId);
    setSelectedVariantIds((prev) =>
      prev.includes(vIdStr) ? prev.filter((id) => id !== vIdStr) : [...prev, vIdStr]
    );
  };

  const handleConfirmSelect = () => {
    const selectedItems = products.filter((p) =>
      selectedVariantIds.includes(String(p.variant_id))
    );
    onSelect(selectedItems);
    onClose();
  };

  const formatPrice = (price) => {
    const num = Number(price ?? 0);
    const symbol = currencyCode === "INR" ? "₹" : "$";
    return `${symbol}${num.toFixed(2)}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "650px",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 30px -5px rgba(0,0,0,0.15), 0 10px 12px -5px rgba(0,0,0,0.1)",
          overflow: "hidden",
          border: "1px solid #e1e3e5",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e1e3e5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffff",
          }}
        >
          <div style={{ fontSize: "17px", fontWeight: 700, color: "#1a1a1a" }}>
            Select products
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "#6d7175",
              lineHeight: 1,
              padding: "6px 10px",
              borderRadius: "6px",
              transition: "background 0.15s ease",
            }}
            onMouseOver={(e) => (e.target.style.background = "#f1f2f3")}
            onMouseOut={(e) => (e.target.style.background = "none")}
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid #e1e3e5",
            background: "#ffffff",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6d7175"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search products by title, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: "8px",
                border: "1px solid #c9cccf",
                fontSize: "13.5px",
                outline: "none",
                boxSizing: "border-box",
                color: "#1a1a1a",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#008ba8")}
              onBlur={(e) => (e.target.style.borderColor = "#c9cccf")}
            />
          </div>
        </div>

        {/* Select All Products Header Banner */}
        <div
          style={{
            padding: "12px 24px",
            background: "#f6f6f7",
            borderBottom: "1px solid #e1e3e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "13.5px",
              fontWeight: 700,
              color: "#1a1a1a",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
                accentColor: "#008ba8",
              }}
            />
            Select All Products ({filteredProducts.length})
          </label>

          <span
            style={{
              fontSize: "12.5px",
              color: "#6d7175",
              fontWeight: 600,
              background: "#ffffff",
              padding: "3px 10px",
              borderRadius: "12px",
              border: "1px solid #e1e3e5",
            }}
          >
            {selectedVariantIds.length} selected
          </span>
        </div>

        {/* Product List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
          {loading ? (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: "#6d7175",
                fontSize: "14px",
              }}
            >
              Loading store products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: "#6d7175",
                fontSize: "14px",
              }}
            >
              No products found matching "{searchQuery}".
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = selectedVariantIds.includes(String(product.variant_id));
              const imageSrc =
                product.image || product.image_url || product.src || PLACEHOLDER_IMAGE;
              const inventoryQty = product.inventory_quantity ?? product.available ?? product.qty ?? 0;

              return (
                <div
                  key={product.variant_id}
                  onClick={() => toggleSelectOne(product.variant_id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 24px",
                    borderBottom: "1px solid #f1f2f3",
                    cursor: "pointer",
                    background: isSelected ? "#f0f9fa" : "#ffffff",
                    transition: "background 0.15s ease",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectOne(product.variant_id);
                    }}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "#008ba8",
                    }}
                  />

                  <img
                    src={imageSrc}
                    alt={product.product_title}
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      border: "1px solid #e1e3e5",
                      background: "#fafafa",
                    }}
                    onError={(e) => {
                      e.target.src = PLACEHOLDER_IMAGE;
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#1a1a1a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {product.product_title}
                    </div>
                    {product.variant_title && product.variant_title !== "Default Title" && (
                      <div style={{ fontSize: "12px", color: "#6d7175", marginTop: "2px" }}>
                        {product.variant_title}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6d7175",
                      minWidth: "90px",
                      textAlign: "right",
                    }}
                  >
                    {inventoryQty} available
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      minWidth: "75px",
                      textAlign: "right",
                    }}
                  >
                    {formatPrice(product.price)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e1e3e5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffff",
          }}
        >
          <div style={{ fontSize: "13.5px", color: "#1a1a1a", fontWeight: 600 }}>
            {selectedVariantIds.length} product{selectedVariantIds.length !== 1 ? "s" : ""} selected
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: "8px",
                border: "1px solid #c9cccf",
                background: "#ffffff",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#202223",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmSelect}
              disabled={selectedVariantIds.length === 0}
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                border: "none",
                background: selectedVariantIds.length === 0 ? "#c9cccf" : "#008ba8",
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#ffffff",
                cursor: selectedVariantIds.length === 0 ? "not-allowed" : "pointer",
                boxShadow: selectedVariantIds.length === 0 ? "none" : "0 2px 6px rgba(0, 139, 168, 0.3)",
                transition: "all 0.15s ease",
              }}
            >
              Select ({selectedVariantIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}