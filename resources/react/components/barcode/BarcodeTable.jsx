// import React from "react";

// export default function BarcodeTable({
//     variants,
//     selectedItems,
//     onSelectionChange,
// }) {

//     const allSelected =
//         variants.length > 0 &&
//         selectedItems.length === variants.length;

//     const toggleSelectOne = (variantId) => {
//         const newSelection = selectedItems.includes(variantId)
//             ? selectedItems.filter((id) => id !== variantId)
//             : [...selectedItems, variantId];
//         onSelectionChange(newSelection);
//     };

//     const toggleSelectAll = () => {
//         if (allSelected) {
//             onSelectionChange([]);
//         } else {
//             onSelectionChange(variants.map((v) => v.variant_id));
//         }
//     };

//     return (
//         <div style={{ border: "1px solid #e1e3e5", borderRadius: "8px", overflow: "hidden" }}>
//             {/* Header row */}
//             <div
//                 style={{
//                     display: "grid",
//                     gridTemplateColumns: "40px 60px 2fr 1.2fr 1.2fr 1fr",
//                     alignItems: "center",
//                     gap: "12px",
//                     padding: "10px 12px",
//                     background: "#f6f6f7",
//                     borderBottom: "1px solid #e1e3e5",
//                     fontWeight: 600,
//                     fontSize: "13px",
//                 }}
//             >
//                 <input
//                     type="checkbox"
//                     checked={allSelected}
//                     onChange={toggleSelectAll}
//                     style={{ width: "16px", height: "16px", cursor: "pointer" }}
//                 />
//                 <span>Image</span>
//                 <span>Product</span>
//                 <span>Current Barcode</span>
//                 <span>Generated Barcode</span>
//                 <span>Price</span>
//             </div>

//             {/* Rows */}
//             <div>
//                 {variants.length === 0 ? (
//                     <div style={{ padding: "24px", textAlign: "center", color: "#6d7175" }}>
//                         No variants found.
//                     </div>
//                 ) : (
//                     variants.map((item, index) => {
//                         const isSelected = selectedItems.includes(item.variant_id);
//                         return (
//                             <div
//                                 key={item.variant_id}
//                                 onClick={() => toggleSelectOne(item.variant_id)}
//                                 style={{
//                                     display: "grid",
//                                     gridTemplateColumns: "40px 60px 2fr 1.2fr 1.2fr 1fr",
//                                     alignItems: "center",
//                                     gap: "12px",
//                                     padding: "10px 12px",
//                                     borderBottom:
//                                         index !== variants.length - 1 ? "1px solid #ececec" : "none",
//                                     background: isSelected ? "#f4f6f8" : "transparent",
//                                     cursor: "pointer",
//                                 }}
//                             >
//                                 <input
//                                     type="checkbox"
//                                     checked={isSelected}
//                                     onChange={() => toggleSelectOne(item.variant_id)}
//                                     onClick={(e) => e.stopPropagation()}
//                                     style={{ width: "16px", height: "16px", cursor: "pointer" }}
//                                 />

//                                 <img
//                                     src={item.image || "https://cdn.shopify.com/static/images/admin/placeholder.png"}
//                                     alt={item.product_title}
//                                     style={{
//                                         width: "40px",
//                                         height: "40px",
//                                         objectFit: "cover",
//                                         borderRadius: "4px",
//                                         border: "1px solid #e1e3e5",
//                                     }}
//                                 />

//                                 <div>
//                                     <s-text fontWeight="bold">{item.product_title}</s-text>
//                                     {item.variant_title !== "Default Title" && (
//                                         <div>
//                                             <s-text tone="subdued">{item.variant_title}</s-text>
//                                         </div>
//                                     )}
//                                 </div>

//                                 <div>
//                                     <s-badge tone="info">{item.barcode || "None"}</s-badge>
//                                 </div>

//                                 <div>
//                                     {item.generated_barcode ? (
//                                         <s-badge tone="success">{item.generated_barcode}</s-badge>
//                                     ) : (
//                                         <s-text tone="subdued">-</s-text>
//                                     )}
//                                 </div>

//                                 <div>
//                                     <s-text>${item.price}</s-text>
//                                 </div>
//                             </div>
//                         );
//                     })
//                 )}
//             </div>
//         </div>
//     );
// }