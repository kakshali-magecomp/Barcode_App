// import React, { forwardRef } from "react";

// import TemplateLabelRenderer from "./TemplateLabelRenderer";

// const PrintLabelDocument = forwardRef(
//     (
//         {
//             products = [],
//             templateDesign = {},
//             barcodeSettings = {},
//             formatProductPrice,
//         },
//         ref
//     ) => {

//         const labels = [];

//         products.forEach((product) => {
//             const quantity = Math.max(
//                 1,
//                 Number(product?.quantity) || 1
//             );

//             for (let i = 0; i < quantity; i++) {
//                 labels.push({
//                     product,
//                     copyIndex: i,
//                 });
//             }
//         });

//         return (
//             <div
//                 ref={ref}
//                 id="print-label-document"
//                 className="print-label-document"
//             >
//                 {labels.map(
//                     ({ product, copyIndex }) => (
//                         <div
//                             key={`${product.variant_id}-${copyIndex}`}
//                             className="label"
//                         >
//                             <TemplateLabelRenderer
//                                 design={templateDesign}
//                                 product={product}
//                                 barcodeSettings={
//                                     barcodeSettings
//                                 }
//                                 formatPrice={
//                                     formatProductPrice
//                                 }
//                                 printMode={true}
//                             />
//                         </div>
//                     )
//                 )}
//             </div>
//         );
//     }
// );

// PrintLabelDocument.displayName =
//     "PrintLabelDocument";

// export default PrintLabelDocument;