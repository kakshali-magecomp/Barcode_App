import React, { useEffect, useState } from "react";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";

const MODAL_ID = "product-picker-modal";
const PLACEHOLDER_IMAGE = "https://cdn.shopify.com/static/images/admin/placeholder.png";

export default function ProductPickerModal({ open, onClose, onSelect }) {
  const shopify = useAppBridge();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const filteredProducts = products.filter((item) =>
    item.product_title.toLowerCase().includes(search.toLowerCase())
  );

  const [printSettings, setPrintSettings] = useState(null);

  useEffect(() => {
    async function loadPrintSettings() {
      try {
        const res = await fetch("/api/print-settings");
        const json = await res.json();
        if (json.success) {
          setPrintSettings(json.settings);
        }
      } catch (err) {
        console.log(err);
      }
    }
    loadPrintSettings();
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!printSettings) return;
    loadProducts();
  }, [open, printSettings]);

  useEffect(() => {
    if (open) {
      shopify.modal.show(MODAL_ID);
    } else {
      shopify.modal.hide(MODAL_ID);
      setSearch("");
      setSelectedIds([]);
      setSelectAll(false);
    }
  }, [open, shopify]);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (!json.status) {
        setProducts([]);
        return;
      }
      let variants = [...json.variants];

      if (printSettings?.hide_product_draft) {
        variants = variants.filter((product) => product.status !== "draft");
      }

      if (printSettings?.hide_product_archived) {
        variants = variants.filter((product) => product.status !== "archived");
      }

      if (printSettings?.sort_by_sku) {
        variants.sort((a, b) => (a.current_sku || "").localeCompare(b.current_sku || ""));
      }

      setProducts(variants);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleSelectOne = (variantId) => {
    setSelectAll(false);
    setSelectedIds((prev) =>
      prev.includes(variantId) ? prev.filter((id) => id !== variantId) : [...prev, variantId]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectAll(false);
      setSelectedIds([]);
    } else {
      setSelectAll(true);
      setSelectedIds(filteredProducts.map((p) => String(p.variant_id)));
    }
  };

  const selectedCount = selectAll ? filteredProducts.length : selectedIds.length;

  const handleConfirm = () => {
    const chosen = products.filter(
      (p) => selectAll || selectedIds.includes(String(p.variant_id))
    );
    onSelect(chosen);
    onClose();
  };

  return (
    <Modal id={MODAL_ID} variant="large">
      <div style={{ padding: "1rem" }}>
        <s-text-field
          label="Search"
          labelAccessibilityVisibility="exclusive"
          placeholder="Search products..."
          value={search}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />

        <div style={{ marginTop: "16px" }}>
          {loading ? (
            <s-box padding="loose" alignContent="center">
              <s-spinner accessibilityLabel="Loading products" />
            </s-box>
          ) : (
            <div style={{ border: "1px solid #e1e3e5", borderRadius: "8px", overflow: "hidden" }}>
              {/* Header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 50px 2fr 1.2fr 1.2fr",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  background: "#f6f6f7",
                  borderBottom: "1px solid #e1e3e5",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <span>Image</span>
                <span>Product</span>
                <span>SKU</span>
                <span>Barcode</span>
              </div>

              {/* Rows */}
              <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                {filteredProducts.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#6d7175" }}>
                    No products found.
                  </div>
                ) : (
                  filteredProducts.map((item, index) => {
                    const id = String(item.variant_id);
                    const isSelected = selectAll || selectedIds.includes(id);
                    return (
                      <div
                        key={id}
                        onClick={() => toggleSelectOne(id)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "40px 50px 2fr 1.2fr 1.2fr",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 12px",
                          borderBottom:
                            index !== filteredProducts.length - 1 ? "1px solid #ececec" : "none",
                          background: isSelected ? "#f4f6f8" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                        <img
                          src={item.image || PLACEHOLDER_IMAGE}
                          alt={item.product_title || "Product image"}
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            border: "1px solid #e1e3e5",
                          }}
                        />
                        <s-text fontWeight="bold">{item.product_title}</s-text>
                        <s-text>{item.current_sku || "-"}</s-text>
                        <s-text>{item.barcode || "-"}</s-text>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <TitleBar title="Choose Products">
        <button variant="primary" onClick={handleConfirm}>
          {`Select (${selectedCount})`}
        </button>
        <button onClick={onClose}>Cancel</button>
      </TitleBar>
    </Modal>
  );
}