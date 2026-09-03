import React, { useState, useEffect, useRef } from "react";
import { useAppBridge, TitleBar } from "@shopify/app-bridge-react";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import ProductPickerModal from "../../components/ProductPickerModal";
import BarcodeRenderer from "../../components/BarcodeRenderer";
import QrCodeRenderer from "../../components/QrCodeRenderer";
import TablePreview from "../../components/TablePreview";
import TemplateLabelRenderer from "../../components/TemplateLabelRenderer";
import { openPrintWindow } from "../../components/Printlayout";
import { useNavigate, useLocation } from "react-router-dom";

const SUMMARY_PAGE_SIZE = 5;

export default function GenerateBarcode() {
    const shopify = useAppBridge();
    const location = useLocation();
    const navigate = useNavigate();

    const {
        fromHistory = false,
        historyId = null,
        mode = "missing",
        selectedProducts: historySelectedProducts = [],
        originalHistoryProducts = [],
        templateId = null,
    } = location.state || {};

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [originalProducts, setOriginalProducts] = useState([]);
    const [progress, setProgress] = useState(null); // { processed, total }
    const [summaryPage, setSummaryPage] = useState(1);
    const [method, setMethod] = useState("missing");
    const [previewItem, setPreviewItem] = useState(null);
    const [previewPage, setPreviewPage] = useState(1);
    const [previewPageSize, setPreviewPageSize] = useState(25);
    const [previewMode, setPreviewMode] = useState("table");
    const [currencyCode, setCurrencyCode] = useState('USD');
    const [bulkQtyInput, setBulkQtyInput] = useState("1");
    const [searchQuery, setSearchQuery] = useState("");
    const [focusedVariantId, setFocusedVariantId] = useState(null);

    // Selection & Delete Modal State
    const [selectedRowVariantIds, setSelectedRowVariantIds] = useState([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState([]);

    const [storeVariants, setStoreVariants] = useState([]);
    const [templatePreviewProduct, setTemplatePreviewProduct] = useState(null);
    const [generatedProducts, setGeneratedProducts] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const printRef = useRef();
    const printContainerRef = useRef(null);
    const [templates, setTemplates] = useState([]);
    const [templateDesign, setTemplateDesign] = useState(null);
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [printSettings, setPrintSettings] = useState(null);

    const handleOpenResourcePicker = async () => {
        let currentPrintSettings = printSettings;
        if (!currentPrintSettings) {
            try {
                const res = await fetch("/api/print-settings");
                const json = await res.json();
                if (json.success) {
                    currentPrintSettings = json.settings;
                    setPrintSettings(json.settings);
                }
            } catch (err) {
                console.error("Failed to fetch print settings for resource picker:", err);
            }
        }

        const filterOpts = {};
        if (currentPrintSettings?.hide_product_draft) {
            filterOpts.draft = false;
        }
        if (currentPrintSettings?.hide_product_archived) {
            filterOpts.archived = false;
        }

        const pickerFn = shopify?.resourcePicker || window?.shopify?.resourcePicker;
        if (typeof pickerFn === "function") {
            try {
                const initialSelection = Array.from(
                    new Set(selectedProducts.map((p) => p.product_id).filter(Boolean))
                ).map((pId) => ({
                    id: String(pId).startsWith("gid://") ? String(pId) : `gid://shopify/Product/${pId}`,
                }));

                const pickerOptions = {
                    type: "product",
                    multiple: true,
                    action: "select",
                    selectionIds: initialSelection.length > 0 ? initialSelection : undefined,
                };
                if (Object.keys(filterOpts).length > 0) {
                    pickerOptions.filter = filterOpts;
                }

                const selection = await pickerFn(pickerOptions);
                if (selection && Array.isArray(selection) && selection.length > 0) {
                    const selectedItems = [];
                    selection.forEach((p) => {
                        const pId = p.id ? String(p.id).split("/").pop() : "";
                        (p.variants || []).forEach((v) => {
                            const vId = v.id ? String(v.id).split("/").pop() : "";
                            const existingQty = selectedProducts.find(
                                (item) => String(item.variant_id) === String(vId)
                            )?.quantity;
                            selectedItems.push({
                                variant_id: vId,
                                product_id: pId,
                                product_title: p.title,
                                variant_title: v.title === "Default Title" ? "" : v.title,
                                option_1: v.title === "Default Title" ? "Default" : v.title,
                                sku: v.sku || "",
                                current_sku: v.sku || "",
                                barcode: v.barcode || "",
                                price: v.price || "0.00",
                                image: v.image?.src || p.images?.[0]?.src || "",
                                available: v.inventoryQuantity ?? 0,
                                inventory_quantity: v.inventoryQuantity ?? 0,
                                vendor: p.vendor || "",
                                quantity:
                                    existingQty ??
                                    currentPrintSettings?.default_print_label_quantity ??
                                    1,
                            });
                        });
                    });
                    if (currentPrintSettings?.sort_by_sku) {
                        selectedItems.sort((a, b) =>
                            (a.current_sku || a.sku || "").localeCompare(b.current_sku || b.sku || "", undefined, { numeric: true, sensitivity: 'base' })
                        );
                    }

                    if (selectedItems.length > 0) {
                        setSelectedProducts(selectedItems);
                        setGeneratedProducts([]);
                        setPreviewItem((prev) => prev || selectedItems[0] || null);
                    }
                }
            } catch (err) {
                console.log("User cancelled product picker or error:", err);
            }
            return;
        }

        try {
            const res = await fetch("/api/products");
            const json = await res.json();
            if (json.status && Array.isArray(json.variants)) {
                let variants = json.variants;
                if (currentPrintSettings?.hide_product_draft) {
                    variants = variants.filter(v => (v.status || '').toLowerCase() !== 'draft');
                }
                if (currentPrintSettings?.hide_product_archived) {
                    variants = variants.filter(v => (v.status || '').toLowerCase() !== 'archived');
                }
                if (currentPrintSettings?.sort_by_sku) {
                    variants.sort((a, b) =>
                        (a.current_sku || a.sku || "").localeCompare(b.current_sku || b.sku || "", undefined, { numeric: true, sensitivity: 'base' })
                    );
                }
                const productsWithQty = variants.map((p) => ({
                    ...p,
                    quantity: currentPrintSettings?.default_print_label_quantity ?? 1,
                }));
                setSelectedProducts(productsWithQty);
                setGeneratedProducts([]);
                setPreviewItem((prev) => prev || productsWithQty[0] || null);
            }
        } catch (err) {
            console.error("Fallback product fetch failed:", err);
        }
    };

    useEffect(() => {
        if (!fromHistory) return;
        setMethod("print");
        setOriginalProducts(originalHistoryProducts);
        const products = historySelectedProducts.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_title: item.product_title,
            barcode: item.barcode,
            barcode_format: item.barcode_format,
            online_url: item.online_url,
            current_sku: item.current_sku ?? item.sku,
            price: item.price,
            currency_code: item.currency_code,
            vendor: item.vendor,
            variant_title: item.variant_title,
            option_1: item.option_1,
            option_2: item.option_2,
            option_3: item.option_3,
            quantity:
                item.qty ??
                item.quantity ??
                printSettings?.default_print_label_quantity ??
                1,
        }));
        let list = [...products];

        if (printSettings?.sort_by_sku) {
            list.sort((a, b) =>
                (a.current_sku || "").localeCompare(b.current_sku || "")
            );
        }

        setSelectedProducts(list);
    }, [fromHistory, historySelectedProducts, originalHistoryProducts]);

    useEffect(() => {
        async function loadTemplates() {
            try {
                const res = await fetch("/api/templates");
                const json = await res.json();
                if (json.success) {
                    setTemplates(json.data || []);
                }
            } catch (err) {
                console.error(err);
            }
        }
        loadTemplates();
    }, []);

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
        async function loadStoreProducts() {
            try {
                const res = await fetch("/api/products");
                const json = await res.json();
                setCurrencyCode(json.currency_code || 'USD');
                if (json.status && Array.isArray(json.variants)) {
                    setStoreVariants(json.variants);
                }
            } catch (err) {
                console.log(err);
            }
        }
        loadStoreProducts();
    }, []);

    useEffect(() => {
        if (!templateDesign?.selected_variant_id) {
            setTemplatePreviewProduct(null);
            return;
        }

        const targetVariantId = String(templateDesign.selected_variant_id);

        const inSelected = selectedProducts.find(
            (p) => String(p.variant_id) === targetVariantId
        );
        if (inSelected) {
            setTemplatePreviewProduct({
                ...inSelected,
                product_title: inSelected.product_title || inSelected.title || '',
                current_sku: inSelected.current_sku || inSelected.sku || '',
                barcode: inSelected.barcode || '',
                price: inSelected.price || '0.00',
                vendor: inSelected.vendor || '',
                variant_title: inSelected.variant_title !== 'Default Title' ? (inSelected.variant_title || '') : '',
                option_1: inSelected.option_1 || (inSelected.variant_title !== 'Default Title' ? inSelected.variant_title : ''),
                online_url: inSelected.online_url || '',
                currency_code: inSelected.currency_code || currencyCode,
            });
            return;
        }

        const inStore = storeVariants.find(
            (v) => String(v.variant_id) === targetVariantId
        );
        if (inStore) {
            setTemplatePreviewProduct({
                product_id: inStore.product_id,
                variant_id: inStore.variant_id,
                product_title: inStore.product_title,
                variant_title: inStore.variant_title !== 'Default Title' ? (inStore.variant_title || '') : '',
                option_1: inStore.option_1 || (inStore.variant_title !== 'Default Title' ? inStore.variant_title : ''),
                current_sku: inStore.current_sku || inStore.sku || '',
                sku: inStore.current_sku || inStore.sku || '',
                barcode: inStore.barcode || '',
                price: inStore.price || '0.00',
                vendor: inStore.vendor || '',
                online_url: inStore.online_url || '',
                currency_code: inStore.currency_code || currencyCode,
            });
            return;
        }

        if (storeVariants.length === 0) {
            fetch("/api/products")
                .then((res) => res.json())
                .then((json) => {
                    if (json.status && Array.isArray(json.variants)) {
                        setStoreVariants(json.variants);
                        const matched = json.variants.find(
                            (v) => String(v.variant_id) === targetVariantId
                        );
                        if (matched) {
                            setTemplatePreviewProduct({
                                product_id: matched.product_id,
                                variant_id: matched.variant_id,
                                product_title: matched.product_title,
                                variant_title: matched.variant_title !== 'Default Title' ? (matched.variant_title || '') : '',
                                option_1: matched.option_1 || (matched.variant_title !== 'Default Title' ? matched.variant_title : ''),
                                current_sku: matched.current_sku || matched.sku || '',
                                sku: matched.current_sku || matched.sku || '',
                                barcode: matched.barcode || '',
                                price: matched.price || '0.00',
                                vendor: matched.vendor || '',
                                online_url: matched.online_url || '',
                                currency_code: matched.currency_code || currencyCode,
                            });
                        }
                    }
                })
                .catch((err) => console.error(err));
        }
    }, [templateDesign, storeVariants, selectedProducts, currencyCode]);

    useEffect(() => {
        if (!printSettings) return;
        if (!fromHistory) {
            setMethod(printSettings.default_generate_option || "missing");
        }
    }, [printSettings, fromHistory]);

    useEffect(() => {
        if (!fromHistory) return;
        if (!templateId) return;
        if (templates.length === 0) return;
        handleTemplateChange(templateId);
    }, [templates, templateId, fromHistory]);

    // Filter products by search query
    const filteredProducts = selectedProducts.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (item.product_title && item.product_title.toLowerCase().includes(q)) ||
            (item.current_sku && item.current_sku.toLowerCase().includes(q)) ||
            (item.barcode && item.barcode.toLowerCase().includes(q)) ||
            (item.vendor && item.vendor.toLowerCase().includes(q))
        );
    });

    useEffect(() => {
        const effectivePageSize = previewPageSize === "all" ? filteredProducts.length || 1 : Number(previewPageSize);
        const totalPreviewPages = Math.max(1, Math.ceil(filteredProducts.length / effectivePageSize));
        if (previewPage > totalPreviewPages) setPreviewPage(totalPreviewPages);
    }, [filteredProducts.length, previewPage, previewPageSize]);

    const handleTemplateChange = async (value) => {
        setSelectedTemplate(String(value));
        setFocusedVariantId(null);
        if (!value) {
            setTemplateDesign(null);
            setTemplatePreviewProduct(null);
            return;
        }
        try {
            setLoadingTemplate(true);
            const response = await fetch(`/api/templates/design/${value}`);
            const json = await response.json();
            const loadedDesign = json.design || json.data || json.template?.design_settings || json;
            const parsedDesign = typeof loadedDesign === 'string' ? JSON.parse(loadedDesign) : loadedDesign;
            const parsedLayout = typeof json.layout === 'string' ? JSON.parse(json.layout) : (json.template?.layout_settings ? JSON.parse(json.template.layout_settings) : null);

            if (parsedDesign) {
                setTemplateDesign({
                    ...parsedDesign,
                    layout_settings: parsedLayout || parsedDesign?.layout_settings || {},
                });
            }
        } catch (err) {
            console.error("Error loading template design:", err);
        } finally {
            setLoadingTemplate(false);
        }
    };

    const updateProductQuantity = (variantId, qty) => {
        setSelectedProducts((prev) =>
            prev.map((item) =>
                item.variant_id === variantId
                    ? { ...item, quantity: qty === "" ? "" : Math.max(1, Number(qty)) }
                    : item
            )
        );
    };

    const applyBulkQuantity = () => {
        const val = Math.max(1, Number(bulkQtyInput) || 1);
        setSelectedProducts((prev) =>
            prev.map((item) => ({ ...item, quantity: val }))
        );
        shopify.toast.show(`Updated print quantity to ${val} for all ${selectedProducts.length} products.`);
    };

    // Selection Handlers
    const toggleSelectRow = (variantId) => {
        const vIdStr = String(variantId);
        setSelectedRowVariantIds((prev) =>
            prev.includes(vIdStr) ? prev.filter((id) => id !== vIdStr) : [...prev, vIdStr]
        );
    };

    const toggleSelectAllRows = () => {
        const currentIds = filteredProducts.map((p) => String(p.variant_id));
        const allSelected =
            currentIds.length > 0 && currentIds.every((id) => selectedRowVariantIds.includes(id));
        setSelectedRowVariantIds(allSelected ? [] : currentIds);
    };

    // Delete Modal Triggers
    const triggerDeleteSingle = (variantId) => {
        setItemsToDelete([String(variantId)]);
        setDeleteModalOpen(true);
    };

    const triggerDeleteBulk = () => {
        if (selectedRowVariantIds.length === 0) return;
        setItemsToDelete(selectedRowVariantIds);
        setDeleteModalOpen(true);
    };

    const triggerDeleteAll = () => {
        const allIds = selectedProducts.map((p) => String(p.variant_id));
        setItemsToDelete(allIds);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        setSelectedProducts((prev) =>
            prev.filter((p) => !itemsToDelete.includes(String(p.variant_id)))
        );
        setSelectedRowVariantIds((prev) =>
            prev.filter((id) => !itemsToDelete.includes(id))
        );
        shopify.toast.show(
            `${itemsToDelete.length} product${itemsToDelete.length !== 1 ? 's' : ''} removed from list.`
        );
        setDeleteModalOpen(false);
        setItemsToDelete([]);
    };

    const savePrintHistory = async () => {
        try {
            const response = await fetch("/api/print-history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    template_id: Number(selectedTemplate),
                    products: selectedProducts.map(product => ({
                        product_id: product.product_id ?? null,
                        variant_id: product.variant_id,
                        product_title: product.product_title,
                        current_sku: product.current_sku,
                        barcode: product.barcode,
                        barcode_format: templateDesign?.barcode_format ?? product.barcode_format ?? "CODE128",
                        template_settings: templateDesign,
                        online_url: product.online_url,
                        price: product.price,
                        currency_code: product.currency_code,
                        vendor: product.vendor,
                        variant_title: product.variant_title,
                        option_1: product.option_1,
                        option_2: product.option_2,
                        option_3: product.option_3,
                        qty: product.quantity,
                    }))
                }),
            });
            await response.json();
        } catch (err) {
            console.error(err);
        }
    };

    const generateBarcode = async () => {
        if (method !== "missing" && selectedProducts.length === 0) {
            shopify.toast.show("Please select at least one product.");
            return;
        }
        try {
            setLoading(true);
            setError("");
            const requestData = {
                method,
                variants:
                    method === "missing"
                        ? []
                        : selectedProducts.map((item) => ({
                            product_id: item.product_id,
                            variant_id: item.variant_id,
                            inventory_item_id: item.inventory_item_id,
                            product_title: item.product_title,
                            variant_title: item.variant_title,
                            vendor: item.vendor,
                            product_type: item.product_type,
                            current_sku: item.current_sku,
                            barcode: item.barcode,
                            online_url: item.online_url,
                            price: item.price,
                            option_1: item.option_1,
                            option_2: item.option_2,
                            option_3: item.option_3,
                            metafields: item.metafields,
                        })),
            };
            const response = await fetch("/api/products/generate-barcode", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(requestData),
            });
            const json = await response.json();
            if (!response.ok) {
                throw new Error(json.error || json.message || "Unable to generate barcode.");
            }
            if (json.status !== 1) {
                throw new Error(json.error || json.message || "Barcode generation failed.");
            }

            if (json.generated_count === 0) {
                shopify.toast.show(json.message || "Nothing to generate.");
                setLoading(false);
                return;
            }

            if (json.queued) {
                setProgress({ processed: 0, total: json.total });
                pollBarcodeBulkOperation(json.operation_id);
                return;
            }

            const updatedProducts = json.updated_products || [];
            setGeneratedProducts(updatedProducts);
            setSelectedProducts(prev =>
                prev.map(product => {
                    const updated = updatedProducts.find(p => p.variant_id === product.variant_id);
                    if (!updated) return product;
                    return {
                        ...product,
                        barcode: updated.generated_barcode ?? updated.barcode,
                        generated_barcode: updated.generated_barcode ?? updated.barcode,
                        online_url: updated.online_url ?? product.online_url,
                        barcode_format: updated.barcode_format ?? product.barcode_format,
                    };
                })
            );

            setPickerOpen(false);
            setLoading(false);
            shopify.toast.show("Barcode generated successfully.");
        } catch (err) {
            console.error("Generate Barcode Error:", err);
            setError(err.message || "Something went wrong while generating barcode.");
            shopify.toast.show(err.message || "Server Error");
            setLoading(false);
        }
    };

    const pollBarcodeBulkOperation = (operationId) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/bulk-operations/${operationId}`);
                const json = await res.json();

                if (!json.status) {
                    console.error("Bulk operation poll failed:", json);
                    clearInterval(interval);
                    setError(json.error || "Lost track of the generation job. Check the console for details.");
                    setLoading(false);
                    setProgress(null);
                    return;
                }

                const op = json.operation;
                setProgress({ processed: op.processed, total: op.total });

                if (op.status === "completed" || op.status === "failed" || op.processed >= op.total) {
                    clearInterval(interval);
                    setProgress({ processed: op.total, total: op.total });
                    await new Promise((resolve) => setTimeout(resolve, 300));
                    setGeneratedProducts(op.updated_products || []);
                    setSelectedProducts(prev =>
                        prev.map(product => {
                            const updated = (op.updated_products || []).find(
                                p => (p.variant_id && String(p.variant_id) === String(product.variant_id)) ||
                                    (p.variant_title === product.variant_title && p.product_title === product.product_title)
                            );
                            return updated ? { ...product, barcode: updated.new_barcode } : product;
                        })
                    );
                    setLoading(false);
                    setProgress(null);
                    shopify.toast.show(
                        `${op.processed - op.failed} barcode generated successfully${op.failed ? `, ${op.failed} failed` : ""}.`
                    );
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);
    };

    const handlePrint = async () => {
        const designToUse = templateDesign || activeLabelDesign;
        if (!designToUse) {
            shopify.toast.show("Please select a template.");
            return;
        }

        if (!selectedProducts.length) {
            shopify.toast.show("Please select at least one product.");
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        const paper = templateDesign?.layout_settings;

        if (!paper || !paper.label) {
            console.error("Invalid layout settings:", paper);
            shopify.toast.show("This template does not have valid paper settings.");
            return;
        }

        const rows = Math.max(1, Number(paper.rows) || 1);
        const columns = Math.max(1, Number(paper.columns) || 1);
        const labelsPerSheet = rows * columns;
        const allLabels = [];

       const getPrintableLabelHtml = (variantId) => {
    const printLabel = document.getElementById(`print-label-${variantId}`);
    if (!printLabel) return null;

    const clone = printLabel.cloneNode(true);
    const originalCanvases = printLabel.querySelectorAll("canvas");
    const cloneCanvases = clone.querySelectorAll("canvas");

    originalCanvases.forEach((canvas, i) => {
        const cloneCanvas = cloneCanvases[i];
        if (!cloneCanvas || !cloneCanvas.parentNode) return;

        const img = document.createElement("img");
        try {
            img.src = canvas.toDataURL("image/png");
        } catch (e) {
            console.error("Failed to convert canvas to image for print:", e);
        }
        img.width = canvas.width;
        img.height = canvas.height;
        img.style.cssText = canvas.style.cssText || "width:100%;height:auto;";
        img.className = canvas.className;

        cloneCanvas.parentNode.replaceChild(img, cloneCanvas);
    });

    return clone.innerHTML;
};

selectedProducts.forEach((product) => {
    const labelHtml = getPrintableLabelHtml(product.variant_id);
    if (!labelHtml) {
        console.warn(`Print label not found for variant ${product.variant_id}`);
        return;
    }
    const qty = Math.max(1, Number(product.quantity) || 1);
    for (let i = 0; i < qty; i++) {
        allLabels.push(`
        <div class="label">
            ${labelHtml}
        </div>
    `);
    }
});

        if (!allLabels.length) {
            shopify.toast.show("No labels available to print.");
            return;
        }

        const sheets = [];
        for (let start = 0; start < allLabels.length; start += labelsPerSheet) {
            const sheetLabels = allLabels.slice(start, start + labelsPerSheet);
            sheets.push(`
            <div class="print-sheet">
                ${sheetLabels.join("")}
            </div>
        `);
        }

        const bodyHtml = sheets.join("");
        const success = openPrintWindow({
            bodyHtml,
            paperTemplate: paper,
            useJsBarcodeScript: true,
            onAfterPrint: savePrintHistory,
        });

        if (!success) {
            shopify.toast.show(
                "Failed to open print window. Please allow popups for this website.",
                { duration: 5000, isError: true }
            );
        }
    };

    const getSymbolValue = (product) => {
        const design = templateDesign || activeLabelDesign;
        if (!design) return product.barcode || product.current_sku || product.sku || product.product_title || "123456789012";
        const fieldSource = design.symbol_field_source || "barcode_value";
        switch (fieldSource) {
            case "product_name":
            case "title":
            case "name":
                return String(product.product_title || product.title || "Product Name").trim();

            case "product_price":
            case "price":
                return String(formatProductPrice(product) || "0.00").trim();

            case "product_vendor":
            case "vendor":
                return String(product.vendor || "Vendor").trim();

            case "product_online_url":
            case "product_page_url":
            case "online_url":
            case "url": {
                const params = new URLSearchParams(window.location.search);
                const shopDomain = params.get('shop') || window.shopify?.config?.shop || 'kakshalijani.myshopify.com';
                let rawUrl = product.online_url || product.url || "";
                if (rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) && !rawUrl.includes("store.myshopify.com")) {
                    return rawUrl.trim();
                }
                const handle = product.handle || (product.product_title || product.title || "product").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                const variantParam = product.variant_id ? `?variant=${product.variant_id}` : "";
                if (rawUrl && rawUrl.startsWith("/")) {
                    return `https://${shopDomain}${rawUrl}${variantParam}`.trim();
                }
                return `https://${shopDomain}/products/${handle}${variantParam}`.trim();
            }

            case "sku_value":
            case "product_sku":
            case "sku":
                return String(product.current_sku || product.sku || product.barcode || "SKU-EMPTY").trim();

            case "barcode_value":
            case "barcode":
            default:
                return String(product.barcode || product.generated_barcode || product.current_barcode || product.current_sku || product.sku || product.product_title || "123456789012").trim();
        }
    };

    const formatProductPrice = (product) => {
        const decimals = Number(printSettings?.price_decimal_number ?? 2);
        let originalPrice = Number(product?.price ?? 0);
        const vatPercentage = Number(printSettings?.vat_percentage ?? 0);
        const priceWithVat = originalPrice + (originalPrice * vatPercentage) / 100;
        const amount = priceWithVat.toFixed(decimals);

        let format = String(templateDesign?.line2_currency_format ?? "").trim();
        format = format
            .replace(/\{\{amount\}\}/gi, "{amount}")
            .replace(/\$amount/gi, "${amount}");

        if (format.includes("{amount}")) {
            return format.replace(/\{amount\}/gi, amount);
        }

        const ENUM_TOKENS = ["without_currency", "with_currency", "currency_code"];
        const isEnumToken = ENUM_TOKENS.includes(format.toLowerCase());

        if (format && !isEnumToken) {
            return `${format} ${amount}`;
        }

        const resolvedFormat = isEnumToken
            ? format.toLowerCase()
            : (printSettings?.currency_format ?? "without_currency");

        const currency = product?.currency_code || currencyCode || 'USD';
        const locale = currency === 'INR' ? 'en-IN' : 'en';

        if (resolvedFormat === "currency_code") {
            return `${amount} ${currency}`;
        }

        if (resolvedFormat === "with_currency") {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
                currencyDisplay: 'symbol',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            }).format(priceWithVat);
        }

        return amount;
    };

    const totalSummaryPages = Math.max(1, Math.ceil(generatedProducts.length / SUMMARY_PAGE_SIZE));
    const summaryStart = (summaryPage - 1) * SUMMARY_PAGE_SIZE;
    const summaryEnd = summaryStart + SUMMARY_PAGE_SIZE;
    const paginatedSummary = generatedProducts.slice(summaryStart, summaryEnd);

    const effectivePageSize = previewPageSize === "all" ? filteredProducts.length || 1 : Number(previewPageSize);
    const totalPreviewPages = Math.max(1, Math.ceil(filteredProducts.length / effectivePageSize));
    const previewStart = (previewPage - 1) * effectivePageSize;
    const previewEnd = previewStart + effectivePageSize;

    const allRowsSelected =
        filteredProducts.length > 0 &&
        filteredProducts.every((p) => selectedRowVariantIds.includes(String(p.variant_id)));

    const totalLabelsCount = selectedProducts.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1),
        0
    );

    // Layout specs calculation
    const paperLayout = templateDesign?.layout_settings || {};
    const rows = Math.max(1, Number(paperLayout.rows) || 1);
    const columns = Math.max(1, Number(paperLayout.columns) || 1);
    const labelsPerSheet = rows * columns;
    const estimatedSheets = Math.ceil(totalLabelsCount / (labelsPerSheet || 1));

    // Default label design fallback for preview if template is not chosen yet
    const fallbackDesign = {
        symbol_enabled: true,
        symbol_type: "BARCODE",
        symbol_field_source: "barcode_value",
        barcode_format: "CODE128",
        barcode_width: 2,
        barcode_height: 50,
        line1_sku: true,
        line2_name: true,
        line2_price: true,
        line3_vendor: true,
    };

    const activeLabelDesign = templateDesign || fallbackDesign;

    // Determine which product is currently focused in preview
    const activeFocusedProduct =
        selectedProducts.find((p) => String(p.variant_id) === String(focusedVariantId)) ||
        templatePreviewProduct ||
        filteredProducts[0] ||
        selectedProducts[0] || {
            product_title: "Sample Product",
            current_sku: "SKU-SAMPLE-1001",
            barcode: "123456789012",
            price: "29.99",
            vendor: "Store Vendor",
            variant_title: "Default Variant",
        };

    return (
        <>
            <TitleBar title="barcodedemo-app" />

            <DeleteConfirmationModal
                open={deleteModalOpen}
                title={`Remove ${itemsToDelete.length} product${itemsToDelete.length !== 1 ? 's' : ''}?`}
                message={`Are you sure you want to remove ${itemsToDelete.length === 1
                    ? 'this product'
                    : `these ${itemsToDelete.length} products`
                    } from the barcode list?`}
                onConfirm={handleConfirmDelete}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setItemsToDelete([]);
                }}
            />

            <s-page heading="Barcode App" subheading="Generate clean barcode values and print formatted sticker labels tailored to your paper template.">
                {/* Header Banner */}
                <s-section>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            padding: '16px 20px',
                            borderRadius: '12px',
                            background: 'linear-gradient(90deg, #01161d 0%, #008ba8 100%)',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{ width: '22px', height: '22px', color: '#008ba8' }}>
                                    <s-icon type="barcode" tone="inherit" size="base" />
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>
                                    Generate Barcode & Print Labels
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '2px' }}>
                                    Create barcode values and print barcode stickers customized for your store
                                </div>
                            </div>
                        </div>

                        <s-stack direction="inline" gap="base">
                            <s-button icon="settings" onClick={() => navigate('/Settingindex')}>
                                Go to Settings
                            </s-button>
                            <s-button onClick={() => navigate("/LabelHistory")}>
                                Label History
                            </s-button>
                            <s-button onClick={() => navigate("/TamplateCreate")}>
                                Create Template
                            </s-button>
                            {method === "missing" && (
                                <s-button
                                    key={loading ? 'bc-btn-loading-top' : 'bc-btn-idle-top'}
                                    variant="primary"
                                    loading={loading}
                                    onClick={generateBarcode}
                                >
                                    Generate Barcode
                                </s-button>
                            )}
                        </s-stack>
                    </div>
                </s-section>

                {error && (
                    <s-section>
                        <s-banner tone="critical" onDismiss={() => setError("")}>
                            {error}
                        </s-banner>
                    </s-section>
                )}

                {/* Generation Method Choice */}
                <s-section>
                    <div
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '14px 16px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Choose Generation or Print Method</span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Select how products or barcode labels should be processed</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
                            {[
                                { value: 'missing', label: 'Missing Barcodes Only', desc: 'Generate barcodes only for items missing a barcode.' },
                                { value: 'replace', label: 'Selected Products', desc: 'Generate new barcodes for selected products.' },
                                { value: 'sku', label: 'Generate from SKU', desc: 'Copy product SKU code into barcode field.' },
                                { value: 'print', label: 'Print Labels Only', desc: 'Print physical barcode stickers for selected items.' },
                            ].map((opt) => {
                                const isActive = method === opt.value;
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => setMethod(opt.value)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            background: isActive ? '#f0f9ff' : '#f8fafc',
                                            border: isActive ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                                            boxShadow: isActive ? '0 4px 12px rgba(2, 132, 199, 0.08)' : 'none',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="radio"
                                                name="barcode-method"
                                                value={opt.value}
                                                checked={isActive}
                                                onChange={() => setMethod(opt.value)}
                                                style={{ accentColor: '#0284c7', margin: 0, cursor: 'pointer' }}
                                            />
                                            <span style={{ fontWeight: 700, fontSize: '13px', color: isActive ? '#0369a1' : '#1e293b' }}>
                                                {opt.label}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', paddingLeft: '20px', lineHeight: 1.3 }}>
                                            {opt.desc}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {method === "replace" && (
                            <div style={{ marginTop: '12px' }}>
                                <s-banner tone="warning">
                                    <strong>Warning:</strong> Existing barcodes will be replaced with newly generated values.
                                </s-banner>
                            </div>
                        )}

                        {method === "print" && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '16px',
                                    flexWrap: 'wrap',
                                    marginTop: '10px',
                                    padding: '14px 18px',
                                    background: '#f4f6f8',
                                    borderRadius: '10px',
                                    border: '1px solid #e1e3e5',
                                }}
                            >
                                <div style={{ flex: '1', minWidth: '240px', maxWidth: '420px' }}>
                                    <s-select
                                        label="Choose a template to print"
                                        value={selectedTemplate ? String(selectedTemplate) : ""}
                                        onChange={(event) => {
                                            const value = event.currentTarget.value;
                                            setSelectedTemplate(value);
                                            handleTemplateChange(value);
                                        }}
                                    >
                                        <s-option value="">Select Template</s-option>
                                        {templates.map((template) => (
                                            <s-option key={template.id} value={String(template.id)}>
                                                {template.template_name}
                                            </s-option>
                                        ))}
                                    </s-select>
                                </div>
                            </div>
                        )}
                    </div>
                </s-section>

                {/* Progress Bar (when bulk job running) */}
                {loading && progress && progress.total > 0 && (
                    <s-section>
                        <s-box padding="base" borderWidth="base" borderRadius="base">
                            <s-stack direction="block" gap="tight">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <s-text fontWeight="bold">Generating barcodes in progress...</s-text>
                                    <s-badge tone="info">{progress.processed} / {progress.total}</s-badge>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuenow={progress.processed}
                                    aria-valuemin={0}
                                    aria-valuemax={progress.total}
                                    aria-label={`${progress.processed} of ${progress.total} products processed`}
                                    style={{
                                        width: '100%',
                                        height: '10px',
                                        borderRadius: '999px',
                                        background: '#e1e3e5',
                                        overflow: 'hidden',
                                        marginTop: '6px'
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${Math.min(100, (progress.processed / progress.total) * 100)}%`,
                                            height: '100%',
                                            background: '#008ba8',
                                            borderRadius: '999px',
                                            transition: 'width 0.3s ease',
                                        }}
                                    />
                                </div>
                                <s-text tone="subdued" fontSize="small">
                                    Processing products... Please leave this tab open until completion.
                                </s-text>
                            </s-stack>
                        </s-box>
                    </s-section>
                )}

                {/* Selected Products Table Card (Hidden once Barcodes are generated successfully) */}
                {method !== "missing" && method !== "print" && generatedProducts.length === 0 && (
                    <s-section>
                        <s-box padding="base" borderWidth="base" borderRadius="base">
                            <s-stack direction="block" gap="medium">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <s-text fontWeight="bold">Selected Products ({selectedProducts.length})</s-text>
                                        <div style={{ fontSize: '13px', color: '#616161', marginTop: '2px' }}>
                                            Products chosen for barcode generation
                                        </div>
                                    </div>
                                    {selectedRowVariantIds.length > 0 && (
                                        <s-button tone="critical" onClick={triggerDeleteBulk}>
                                            Delete selected ({selectedRowVariantIds.length})
                                        </s-button>
                                    )}
                                </div>

                                {selectedProducts.length === 0 ? (
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            padding: '24px 16px',
                                            background: '#f6f6f7',
                                            borderRadius: '8px',
                                            border: '1px dashed #c9cccf'
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, color: '#202223', marginBottom: '4px' }}>
                                            No products selected yet
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6d7175', marginBottom: '12px' }}>
                                            Click "Choose Products" to select catalog items.
                                        </div>
                                        <s-button variant="secondary" onClick={handleOpenResourcePicker}>
                                            Choose Products
                                        </s-button>
                                    </div>
                                ) : (
                                    <>
                                        <s-table>
                                            <s-table-header-row>
                                                <s-table-header>
                                                    <s-checkbox
                                                        label="Select all"
                                                        labelAccessibilityVisibility="exclusive"
                                                        checked={allRowsSelected || undefined}
                                                        onChange={toggleSelectAllRows}
                                                    />
                                                </s-table-header>
                                                <s-table-header>Product Title</s-table-header>
                                                <s-table-header>Variant / Option</s-table-header>
                                                <s-table-header>Vendor</s-table-header>
                                                <s-table-header>Barcode</s-table-header>
                                                <s-table-header>Action</s-table-header>
                                            </s-table-header-row>
                                            <s-table-body>
                                                {selectedProducts.map((p) => {
                                                    const isChecked = selectedRowVariantIds.includes(String(p.variant_id));
                                                    return (
                                                        <s-table-row key={p.variant_id}>
                                                            <s-table-cell>
                                                                <s-checkbox
                                                                    label={`Select ${p.product_title}`}
                                                                    labelAccessibilityVisibility="exclusive"
                                                                    checked={isChecked || undefined}
                                                                    onChange={() => toggleSelectRow(p.variant_id)}
                                                                />
                                                            </s-table-cell>
                                                            <s-table-cell>
                                                                <s-text fontWeight="bold">{p.product_title}</s-text>
                                                            </s-table-cell>
                                                            <s-table-cell>
                                                                <s-text tone="subdued">{p.option_1 || "Default"}</s-text>
                                                            </s-table-cell>
                                                            <s-table-cell>
                                                                <s-badge tone="info">{p.vendor || "N/A"}</s-badge>
                                                            </s-table-cell>
                                                            <s-table-cell>
                                                                {p.barcode ? (
                                                                    <s-text fontWeight="bold">{p.barcode}</s-text>
                                                                ) : (
                                                                    <s-badge tone="attention">No Barcode</s-badge>
                                                                )}
                                                            </s-table-cell>
                                                            <s-table-cell>
                                                                <s-button
                                                                    icon="delete"
                                                                    variant="tertiary"
                                                                    tone="critical"
                                                                    onClick={() => triggerDeleteSingle(p.variant_id)}
                                                                />
                                                            </s-table-cell>
                                                        </s-table-row>
                                                    );
                                                })}
                                            </s-table-body>
                                        </s-table>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
                                            <s-button
                                                key={loading ? 'bc-btn-loading-bottom' : 'bc-btn-idle-bottom'}
                                                variant="primary"
                                                loading={loading}
                                                onClick={generateBarcode}
                                            >
                                                Generate Barcode
                                            </s-button>
                                        </div>
                                    </>
                                )}
                            </s-stack>
                        </s-box>
                    </s-section>
                )}

                {/* Generated Barcode Summary Table */}
                {generatedProducts.length > 0 && method !== "print" && (
                    <s-section>
                        <s-box padding="base" borderWidth="base" borderRadius="base">
                            <s-stack direction="block" gap="medium">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                    <div>
                                        <s-text fontWeight="bold" fontSize="medium">Generated Barcode Results</s-text>
                                        <div style={{ fontSize: '13px', color: '#616161', marginTop: '2px' }}>
                                            Successfully generated {generatedProducts.length} barcode values
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {generatedProducts.length > SUMMARY_PAGE_SIZE && (
                                            <s-text tone="subdued">
                                                Page {summaryPage} of {totalSummaryPages}
                                            </s-text>
                                        )}
                                        <s-button variant="primary" onClick={handleOpenResourcePicker}>
                                            Choose Products
                                        </s-button>
                                    </div>
                                </div>

                                <s-table
                                    paginate={generatedProducts.length > SUMMARY_PAGE_SIZE || undefined}
                                    hasPreviousPage={summaryPage > 1 || undefined}
                                    hasNextPage={summaryPage < totalSummaryPages || undefined}
                                    onPreviousPage={() => setSummaryPage((p) => Math.max(1, p - 1))}
                                    onNextPage={() => setSummaryPage((p) => Math.min(totalSummaryPages, p + 1))}
                                >
                                    <s-table-header-row>
                                        <s-table-header>Product Title</s-table-header>
                                        <s-table-header>Variant</s-table-header>
                                        <s-table-header>Previous Barcode</s-table-header>
                                        <s-table-header>New Barcode</s-table-header>
                                        <s-table-header>Status</s-table-header>
                                    </s-table-header-row>
                                    <s-table-body>
                                        {paginatedSummary.map((item, index) => (
                                            <s-table-row key={summaryStart + index}>
                                                <s-table-cell>
                                                    <s-text fontWeight="bold">{item.product_title}</s-text>
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-text tone="subdued">{item.variant_title || "Default Title"}</s-text>
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-text tone="subdued">{item.old_barcode || "-"}</s-text>
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-text fontWeight="bold" tone="success">{item.new_barcode}</s-text>
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-badge tone="success">Generated</s-badge>
                                                </s-table-cell>
                                            </s-table-row>
                                        ))}
                                    </s-table-body>
                                </s-table>
                            </s-stack>
                        </s-box>
                    </s-section>
                )}

                {/* State-of-the-Art Top Preview & Workspace Layout */}
                {method === "print" && (
                    <s-section>
                        <s-box padding="base" borderWidth="base" borderRadius="base">
                            {selectedProducts.length === 0 ? (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: '44px 20px',
                                        background: '#f9fafb',
                                        borderRadius: '12px',
                                        border: '2px dashed #d2d5d8'
                                    }}
                                >
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#202223', marginBottom: '6px' }}>
                                        No products selected for printing
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#6d7175', marginBottom: '18px' }}>
                                        Click "Choose Products" to select catalog items and generate sticker labels.
                                    </div>
                                    <s-button variant="primary" onClick={handleOpenResourcePicker}>
                                        Choose Products
                                    </s-button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
                                    {/* TOP STICKER PREVIEW & JOB OVERVIEW CARD */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '20px',
                                            alignItems: 'stretch',
                                            flexWrap: 'wrap',
                                            background: '#ffffff',
                                            border: '1px solid #008ba8',
                                            borderRadius: '12px',
                                            padding: '16px 20px',
                                            boxShadow: '0 4px 14px rgba(0, 139, 168, 0.08)',
                                            boxSizing: 'border-box',
                                        }}
                                    >
                                        {/* Sticker Canvas Live Renderer */}
                                        <div style={{ flex: '0 0 320px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#01161d' }}>
                                                    Live Sticker Preview
                                                </span>
                                                <s-badge tone="info">{templateDesign?.template_name || 'Active Design'}</s-badge>
                                            </div>

                                            <div
                                                style={{
                                                    flex: 1,
                                                    background: '#f8fafc',
                                                    border: '1px dashed #008ba8',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minHeight: '150px',
                                                }}
                                            >
                                                <TemplateLabelRenderer
                                                    design={activeLabelDesign}
                                                    product={activeFocusedProduct}
                                                    barcodeSettings={activeLabelDesign}
                                                    formatPrice={formatProductPrice}
                                                    printMode={false}
                                                    barcodeValue={getSymbolValue(activeFocusedProduct)}
                                                />
                                            </div>

                                            <div style={{ fontSize: '11px', color: '#6d7175', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                Previewing: <strong>{activeFocusedProduct.product_title}</strong>
                                            </div>
                                        </div>

                                        {/* Print Stats & Quick Actions */}
                                        <div style={{ flex: '1 1 300px', minWidth: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px', boxSizing: 'border-box' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#202223' }}>
                                                    Print Job Overview & Sheet Specs
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                                                    <div style={{ background: '#f4f6f8', padding: '10px 12px', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '11px', color: '#6d7175', fontWeight: 600 }}>Selected Products</div>
                                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#202223', marginTop: '2px' }}>
                                                            {selectedProducts.length} items
                                                        </div>
                                                    </div>

                                                    <div style={{ background: '#f0f9fa', padding: '10px 12px', borderRadius: '8px', border: '1px solid #c4ebf2' }}>
                                                        <div style={{ fontSize: '11px', color: '#008ba8', fontWeight: 600 }}>Total Stickers to Print</div>
                                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#008ba8', marginTop: '2px' }}>
                                                            {totalLabelsCount} labels
                                                        </div>
                                                    </div>

                                                    <div style={{ background: '#f4f6f8', padding: '10px 12px', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '11px', color: '#6d7175', fontWeight: 600 }}>Paper Layout</div>
                                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#202223', marginTop: '2px' }}>
                                                            {rows}×{columns} ({labelsPerSheet}/sheet)
                                                        </div>
                                                    </div>

                                                    <div style={{ background: '#f4f6f8', padding: '10px 12px', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '11px', color: '#6d7175', fontWeight: 600 }}>Estimated Sheets</div>
                                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#202223', marginTop: '2px' }}>
                                                            ~{estimatedSheets} sheet{estimatedSheets !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #e1e3e5' }}>
                                                <s-button variant="primary" icon="print" onClick={handlePrint}>
                                                    Print Labels ({totalLabelsCount} Stickers)
                                                </s-button>
                                                <s-button onClick={handleOpenResourcePicker}>
                                                    Choose Products ({selectedProducts.length})
                                                </s-button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PRODUCT MANAGEMENT & QUANTITY EDIT TABLE */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
                                        {/* Toolbar */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: '12px',
                                                flexWrap: 'wrap',
                                                background: '#ffffff',
                                                padding: '12px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid #e1e3e5',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#202223' }}>
                                                    Product List ({filteredProducts.length})
                                                </span>
                                                {selectedRowVariantIds.length > 0 && (
                                                    <s-button tone="critical" onClick={triggerDeleteBulk}>
                                                        Delete ({selectedRowVariantIds.length})
                                                    </s-button>
                                                )}
                                            </div>

                                            <s-button tone="critical" variant="tertiary" onClick={triggerDeleteAll}>
                                                Delete All
                                            </s-button>
                                        </div>

                                        {/* Search & Bulk Quantity Controls */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '12px',
                                                flexWrap: 'wrap',
                                                background: '#f8fafc',
                                                padding: '12px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid #e1e3e5',
                                            }}
                                        >
                                            <div style={{ flex: '1', minWidth: '220px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Search product, SKU..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #c9cccf',
                                                        fontSize: '13px',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        background: '#ffffff',
                                                    }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '12px', color: '#444', fontWeight: 600 }}>Set all qty:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={bulkQtyInput}
                                                    onChange={(e) => setBulkQtyInput(e.target.value)}
                                                    style={{
                                                        width: '54px',
                                                        padding: '7px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #c9cccf',
                                                        fontSize: '13px',
                                                        textAlign: 'center',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        background: '#ffffff',
                                                    }}
                                                />
                                                <s-button onClick={applyBulkQuantity}>
                                                    Apply All
                                                </s-button>
                                            </div>
                                        </div>

                                        {/* Fixed Layout Table */}
                                        <div style={{ border: '1px solid #e1e3e5', borderRadius: '10px', overflow: 'hidden', background: '#ffffff' }}>
                                            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: '#f4f6f8', borderBottom: '1px solid #e1e3e5' }}>
                                                        <th style={{ ...thStyle, width: '38px' }}>
                                                            <s-checkbox
                                                                label="Select all"
                                                                labelAccessibilityVisibility="exclusive"
                                                                checked={allRowsSelected || undefined}
                                                                onChange={toggleSelectAllRows}
                                                            />
                                                        </th>
                                                        <th style={{ ...thStyle, width: '35%' }}>Product Title</th>
                                                        <th style={{ ...thStyle, width: '40%' }}>SKU</th>
                                                        <th style={{ ...thStyle, width: '110px', textAlign: 'center' }}>Label Qty</th>
                                                        <th style={{ ...thStyle, width: '44px', textAlign: 'center' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredProducts.slice(previewStart, previewEnd).map((product) => {
                                                        const isChecked = selectedRowVariantIds.includes(String(product.variant_id));
                                                        const isFocused = String(product.variant_id) === String(activeFocusedProduct.variant_id);
                                                        return (
                                                            <tr
                                                                key={product.variant_id}
                                                                onClick={() => setFocusedVariantId(product.variant_id)}
                                                                style={{
                                                                    borderBottom: '1px solid #e1e3e5',
                                                                    background: isFocused ? '#f0f9fa' : '#ffffff',
                                                                    cursor: 'pointer',
                                                                    transition: 'background 0.15s ease',
                                                                }}
                                                            >
                                                                <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                                                                    <s-checkbox
                                                                        label={`Select ${product.product_title}`}
                                                                        labelAccessibilityVisibility="exclusive"
                                                                        checked={isChecked || undefined}
                                                                        onChange={() => toggleSelectRow(product.variant_id)}
                                                                    />
                                                                </td>
                                                                <td style={tdStyle}>
                                                                    <div
                                                                        style={{
                                                                            fontWeight: 600,
                                                                            color: '#202223',
                                                                            fontSize: '13px',
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                        }}
                                                                        title={product.product_title}
                                                                    >
                                                                        {product.product_title}
                                                                    </div>
                                                                    {product.variant_title && product.variant_title !== 'Default Title' && (
                                                                        <div style={{ fontSize: '11px', color: '#6d7175', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {product.variant_title}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={tdStyle}>
                                                                    <div
                                                                        style={{
                                                                            fontSize: '12px',
                                                                            fontFamily: 'monospace',
                                                                            color: '#444',
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                        }}
                                                                        title={product.current_sku || '-'}
                                                                    >
                                                                        {product.current_sku || '-'}
                                                                    </div>
                                                                </td>
                                                                <td style={{ ...tdStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateProductQuantity(product.variant_id, Math.max(1, (Number(product.quantity) || 1) - 1))}
                                                                            style={btnQtyStyle}
                                                                        >
                                                                            −
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={product.quantity === "" ? "" : String(product.quantity ?? 1)}
                                                                            onChange={(e) => updateProductQuantity(product.variant_id, e.target.value)}
                                                                            style={inputQtyStyle}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateProductQuantity(product.variant_id, (Number(product.quantity) || 1) + 1)}
                                                                            style={btnQtyStyle}
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td style={{ ...tdStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                                    <s-button
                                                                        icon="delete"
                                                                        variant="tertiary"
                                                                        tone="critical"
                                                                        accessibilityLabel="Remove"
                                                                        onClick={() => triggerDeleteSingle(product.variant_id)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '12px', color: '#666' }}>Show:</span>
                                                <s-select
                                                    label="Items per page"
                                                    labelAccessibilityVisibility="exclusive"
                                                    value={String(previewPageSize)}
                                                    onChange={(e) => {
                                                        setPreviewPageSize(e.currentTarget.value);
                                                        setPreviewPage(1);
                                                    }}
                                                >
                                                    <s-option value="10">10 per page</s-option>
                                                    <s-option value="25">25 per page</s-option>
                                                    <s-option value="50">50 per page</s-option>
                                                    <s-option value="100">100 per page</s-option>
                                                    <s-option value="all">All items</s-option>
                                                </s-select>
                                            </div>

                                            {totalPreviewPages > 1 && (
                                                <s-stack direction="inline" gap="tight" alignItems="center">
                                                    <s-button
                                                        variant="tertiary"
                                                        disabled={previewPage <= 1 || undefined}
                                                        onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                                                    >
                                                        Previous
                                                    </s-button>
                                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                                        {previewPage} / {totalPreviewPages}
                                                    </span>
                                                    <s-button
                                                        variant="tertiary"
                                                        disabled={previewPage >= totalPreviewPages || undefined}
                                                        onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                                                    >
                                                        Next
                                                    </s-button>
                                                </s-stack>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </s-box>
                    </s-section>
                )}



                {/* Offscreen Print Containers */}
                <div
                    ref={printContainerRef}
                    style={{
                        position: "absolute",
                        left: "-100000px",
                        top: 0,
                        width: "1px",
                        height: "1px",
                        overflow: "hidden",
                    }}
                >
                    {(templateDesign || activeLabelDesign) && selectedProducts.map((product) => (
                        <div
                            key={`print-${product.variant_id}`}
                            id={`print-label-${product.variant_id}`}
                            className="print-template-label"
                        >
                            <TemplateLabelRenderer
                                design={activeLabelDesign}
                                product={product}
                                barcodeSettings={activeLabelDesign}
                                formatPrice={formatProductPrice}
                                printMode={true}
                                barcodeValue={getSymbolValue(product)}
                            />
                        </div>
                    ))}
                </div>
            </s-page>
        </>
    );
}

const thStyle = {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6d7175',
    textAlign: 'left',
    boxSizing: 'border-box',
};

const tdStyle = {
    padding: '10px 12px',
    fontSize: '13px',
    verticalAlign: 'middle',
    boxSizing: 'border-box',
};

const btnQtyStyle = {
    width: '24px',
    height: '24px',
    border: '1px solid #c9cccf',
    background: '#ffffff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    lineHeight: '1',
    color: '#333',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const inputQtyStyle = {
    width: '40px',
    height: '24px',
    border: '1px solid #8c9196',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '12px',
    background: '#ffffff',
    color: '#202223',
    outline: 'none',
    boxSizing: 'border-box',
    padding: '0',
};