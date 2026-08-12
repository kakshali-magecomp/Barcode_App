import React from "react";
import BarcodeRenderer from "./BarcodeRenderer";
import QrCodeRenderer from "./QrCodeRenderer";

export default function TablePreview({
    products = [],
    templateDesign,
    onRemoveProduct,
    onUpdateQuantity,
    formatProductPrice,
    getSymbolValue,
}) {

    const handleQuantityChange = (product, value) => {
        const variantId = product.variant_id;
        // Allow temporary empty input
        if (value === "") {
            onUpdateQuantity(variantId, "");
            return;
        }
        const quantity = Number(value);
        if (!Number.isNaN(quantity) && quantity >= 1) {
            onUpdateQuantity(variantId, Math.floor(quantity));
        }
    };

    return (
        <div
            style={{ width: "100%", border: "1px solid #e1e3e5", borderRadius: "10px", overflow: "hidden", background: "#fff", }}
        >
            {/* Table Header */}
            {/* <div
                style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e1e3e5",
                    background: "#f6f6f7",
                }}
            >
                <strong
                    style={{
                        fontSize: "14px",
                        color: "#202223",
                    }}
                >
                    Products
                </strong>
            </div> */}

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px",}}>
                    <thead>
                        <tr style={{ background: "#f6f6f7", borderBottom: "1px solid #e1e3e5", }}>
                            <th style={headerStyle}>Product</th>
                            <th style={headerStyle}>SKU</th>
                            <th style={headerStyle}>Price</th>
                            <th style={headerStyle}>Barcode</th>
                            <th style={headerStyle}>Quantity</th>
                            <th style={headerStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "#6d7175", }}>
                                    No products selected.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => {
                                const symbolValue =
                                    getSymbolValue(product);

                                return (
                                    <tr key={product.variant_id} id={`label-${product.variant_id}`}
                                        style={{ borderBottom: "1px solid #e1e3e5",}}>
                                        {/* Product */}
                                        <td style={cellStyle}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", }}>
                                                <strong style={{ color: "#202223", fontSize: "14px",}}>
                                                    {product.product_title || "-"}
                                                </strong>
                                                {product.variant_title &&  product.variant_title !==  "Default Title" && (
                                                        <span style={{ fontSize:"12px", color: "#6d7175", }} >
                                                            { product.variant_title }
                                                        </span>
                                                    )}
                                            </div>
                                        </td>

                                        {/* SKU */}
                                        <td style={cellStyle}>
                                            {product.current_sku || "-"}
                                        </td>

                                        {/* Price */}
                                        <td style={cellStyle}>
                                            {formatProductPrice(product)}
                                        </td>

                                        {/* Barcode */}
                                        <td  style={{ ...cellStyle, width: "25%",minWidth: 0,}} >
                                            <div  style={{ width: "100%", minWidth: 0,display: "flex",flexDirection: "column", alignItems: "center", justifyContent: "center",overflow: "hidden",}} >
                                                {/* Barcode */}
                                                <div style={{ width: "100%", maxWidth: "150px",height: "58px",display: "flex",alignItems: "center",justifyContent: "center", overflow: "hidden", }}>
                                                    {templateDesign?.symbol_type === "BARCODE" ? (
                                                        <BarcodeRenderer
                                                            value={symbolValue}
                                                            settings={{
                                                                ...templateDesign,
                                                                // Make the preview barcode fit the table
                                                                symbol_width_px: 140,
                                                            }}
                                                            barcodeSettings={templateDesign}
                                                        />
                                                    ) : (
                                                        <QrCodeRenderer
                                                            value={symbolValue}
                                                            settings={templateDesign}
                                                        />
                                                    )}
                                                </div>

                                                {/* Barcode value BELOW barcode */}
                                                <div style={{ width: "100%", maxWidth: "150px", marginTop: "4px", textAlign: "center", fontSize: "11px",
                                                                 lineHeight: "14px",color: "#6d7175", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", }}
                                                    title={symbolValue || ""}>
                                                    {symbolValue || "-"}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Quantity */}
                                        <td style={cellStyle}>
                                            <div style={{display: "flex", alignItems: "center", gap: "6px", justifyContent: "center",}} >    
                                           
                                                {/* MINUS */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentQuantity = Number(product.quantity) || 1;

                                                        onUpdateQuantity(
                                                            product.variant_id,
                                                            Math.max(1, currentQuantity - 1)
                                                        );
                                                    }}
                                                    style={quantityButtonStyle}
                                                >
                                                    −
                                                </button>

                                                {/* QUANTITY INPUT */}
                                                <input
                                                    type="number"
                                                    min="1"
                                                    inputMode="numeric"
                                                    value={product.quantity === "" ? "" : String(product.quantity ?? 1)}
                                                    onChange={(e) =>
                                                        handleQuantityChange(
                                                            product,
                                                            e.target.value
                                                        )
                                                    }
                                                    onBlur={() => {
                                                        if (
                                                            product.quantity === "" ||
                                                            Number(product.quantity) < 1
                                                        ) {
                                                            onUpdateQuantity(
                                                                product.variant_id,
                                                                1
                                                            );
                                                        }
                                                    }}
                                                    style={{ width: "64px", height: "32px", border: "1px solid #8c9196", borderRadius: "6px", textAlign: "center",
                                                             fontSize: "14px", background: "#fff", color: "#202223", outline: "none", boxSizing: "border-box",}}/>
                                                {/* PLUS */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentQuantity = Number(product.quantity) || 1;

                                                        onUpdateQuantity(
                                                            product.variant_id,
                                                            currentQuantity + 1
                                                        );
                                                    }}
                                                    style={quantityButtonStyle}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>

                                        {/* Action */}
                                        <td style={{ ...cellStyle, textAlign: "center" }}>
                                            <s-button
                                                variant="tertiary"
                                                tone="critical"
                                                icon="delete"
                                                accessibilityLabel={`Remove ${product.product_title}`}
                                                onClick={() =>
                                                    onRemoveProduct(product.variant_id)
                                                }
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const headerStyle = {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#6d7175",
    whiteSpace: "nowrap",
};

const cellStyle = {
    padding: "12px 14px",
    fontSize: "13px",
    color: "#202223",
    verticalAlign: "middle",
};

const quantityButtonStyle = {
    width: "30px",
    height: "30px",
    border: "1px solid #c9cccf",
    background: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: "1",
};