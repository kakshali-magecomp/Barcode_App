import React, { useEffect, useRef, useState } from "react";
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
  const [printSettings, setPrintSettings] = useState(null);
  const pickerOpenRef = useRef(false);

  const getNumericId = (gid) => {
    if (!gid) return null;
    const value = String(gid);
    if (!value.startsWith("gid://shopify/")) {
      return value;
    }
    return value.split("/").pop();
  };

  const toGid = (id, resourceType) => {
    if (!id) return null;
    const value = String(id);
    if (value.startsWith("gid://shopify/")) {
      return value;
    }
    return `gid://shopify/${resourceType}/${value}`;
  };

  const getProductId = (item) => {
    return (
      item.product_id ??
      item.productId ??
      item.product_gid ??
      item.productGid ??
      null
    );
  };

  const getProductGid = (item) => {
    const productId = getProductId(item);

    return productId
      ? toGid(productId, "Product")
      : null;
  };

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const json = await res.json();

      if (!json.status || !Array.isArray(json.variants)) {
        return [];
      }

      let variants = [...json.variants];

      if (printSettings?.hide_product_draft) {
        variants = variants.filter((product) => {
          const status = String(
            product.status ??
              product.product_status ??
              ""
          ).toLowerCase();

          return status !== "draft";
        });
      }

      if (printSettings?.hide_product_archived) {
        variants = variants.filter((product) => {
          const status = String(
            product.status ??
              product.product_status ??
              ""
          ).toLowerCase();

          return status !== "archived";
        });
      }

      if (printSettings?.sort_by_sku) {
        variants.sort((a, b) =>
          String(a.current_sku || "").localeCompare(
            String(b.current_sku || "")
          )
        );
      }

      return variants;
    } catch (error) {
      console.error("Failed to load products:", error);
      return [];
    }
  };

  const buildSelectionIds = (currentProducts) => {
    const selectedVariantIds = new Set(
      alreadySelectedIds.map((id) =>
        getNumericId(id)
      )
    );

    const selectedProductIds = new Set();

    currentProducts.forEach((product) => {
      if (!product?.variant_id) {
        return;
      }

      const variantId = getNumericId(
        product.variant_id
      );

      if (!selectedVariantIds.has(variantId)) {
        return;
      }

      const productGid =
        getProductGid(product);

      if (productGid) {
        selectedProductIds.add(productGid);
      }
    });

    return Array.from(
      selectedProductIds
    ).map((id) => ({
      id,
    }));
  };

  const convertPickerResultToExistingFormat = (
    selectedResources,
    currentProducts
  ) => {
    const selectedProductIds = new Set(
      selectedResources
        .map((product) =>
          getNumericId(product.id)
        )
        .filter(Boolean)
    );

    const selectedVariants =
      currentProducts.filter((product) => {
        const productId = getProductId(product);

        if (!productId) {
          return false;
        }

        return selectedProductIds.has(
          getNumericId(productId)
        );
      });

    return selectedVariants;
  };

  useEffect(() => {
    async function loadPrintSettings() {
      try {
        const res = await fetch(
          "/api/print-settings"
        );

        const json = await res.json();

        if (json.success) {
          setPrintSettings(json.settings);
        }
      } catch (error) {
        console.error(
          "Failed to load print settings:",
          error
        );
      }
    }

    loadPrintSettings();
  }, []);

  useEffect(() => {
    if (!open) {
      pickerOpenRef.current = false;
      return;
    }

    if (!printSettings) {
      return;
    }

    if (pickerOpenRef.current) {
      return;
    }

    pickerOpenRef.current = true;

    const openPicker = async () => {
      try {
        const currentProducts =
          await loadProducts();

        const selectionIds =
          buildSelectionIds(
            currentProducts
          );

        const selectedResources =
          await shopify.resourcePicker({
            type: "product",
            action: "select",
            multiple: true,
            variants: false,
            selectionIds,
            filter: {
              ...(printSettings?.hide_product_draft
                ? { draft: false }
                : {}),
              ...(printSettings?.hide_product_archived
                ? { archived: false }
                : {}),
            },
          });

        if (!selectedResources) {
          onClose?.();
          return;
        }

        const selectedProducts =
          convertPickerResultToExistingFormat(
            selectedResources,
            currentProducts
          );

        onSelect(selectedProducts);
        onClose?.();
      } catch (error) {
        console.error(
          "Shopify Resource Picker error:",
          error
        );

        onClose?.();
      } finally {
        pickerOpenRef.current = false;
      }
    };

    openPicker();
  }, [
    open,
    printSettings,
    shopify,
    onSelect,
    onClose,
    alreadySelectedIds,
  ]);

  return null;
}