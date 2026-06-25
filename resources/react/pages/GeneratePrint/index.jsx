import React, { useEffect, useRef, useState } from "react";
import {
  Page,
  Card,
  Select,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Modal,
  Badge,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import GenerateHistoryModal from "../../components/GenerateHistoryModal";
import PrintHistoryModal from "../../components/PrintHistoryModal";

export default function GeneratePrint() {
  const shopify = useAppBridge();
  const printRef = useRef(null);
  const [generateHistoryOpen, setGenerateHistoryOpen] = useState(false);
  const [printHistoryOpen, setPrintHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("generate_print");
  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState("");
  const [products, setProducts] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePrint = async () => {
    try {
      const response = await fetch("/api/label-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "print",
          template_id: template,
          template_name:
            templates.find(
              (t) => String(t.id) === String(template)
            )?.name || "",
          products: products.map((p) => ({
            id: p.id,
            title: p.title,
            handle: p.handle,
          })),
        }),
      });

      const result = await response.json();

      console.log("PRINT SAVE RESPONSE:", result);

      if (!response.ok || !result.success) {
        shopify.toast.show(
          result.message || "Failed to save print history",
          { isError: true }
        );
        return;
      }

      shopify.toast.show("Print history saved");

      window.print();
    } catch (error) {
      console.error(error);
      shopify.toast.show("Print failed", { isError: true });
    }
  };

  //FETCH TEMPLATES
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const result = await response.json();
      setTemplates(result.data || []);
    } catch (error) {
      console.error(error);
      shopify.toast.show("Failed to load templates", { isError: true });
    }
  };

  //SHOPIFY PRODUCT PICKER
  const chooseProducts = async () => {
    try {
      const selected = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });

      if (selected) setProducts(selected);
    } catch (error) {
      console.error(error);
    }
  };

  //GENERATE / SAVE
  const generateBarcode = async () => {
    if (!products.length) {
      shopify.toast.show("Please select products", { isError: true });
      return;
    }

    if (!template) {
      shopify.toast.show("Please select template", { isError: true });
      return;
    }

    try {
      setLoading(true);
      let type = "generate";

      const response = await fetch("/api/label-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: method.includes("print") ? "print" : "generate", // directly send method
          template_id: template,
          template_name: templates.find(t => t.id == template)?.name,
          products: products.map(p => ({
            id: p.id,
            title: p.title,
            handle: p.handle
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.log("API ERROR:", result);

        shopify.toast.show(
          result.message || "Failed to save",
          { isError: true }
        );
        return;
      }

      shopify.toast.show("Saved successfully");
    } catch (error) {
      console.error(error);
      shopify.toast.show("Something went wrong", { isError: true });
    } finally {
      setLoading(false);
    }
  };

  //PDF DOWNLOAD
  const downloadPDF = async () => {
    try {
      const element = printRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });

      const image = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(image, "PNG", 0, 0, pdfWidth, pdfHeight);

      pdf.save("barcode-labels.pdf");
    } catch (error) {
      console.error(error);
      shopify.toast.show("PDF generation failed", { isError: true });
    }
  };

  // RENDER
  return (
    <Page
      title="Generate & Print Labels"
      secondaryActions={[
        {
          content: "Generate History",
          onAction: () => setGenerateHistoryOpen(true),
        },
        {
          content: "Print History",
          onAction: () => setPrintHistoryOpen(true),
        },
      ]}
    >
      <BlockStack gap="500">

        {/*SETTINGS*/}
        <Card>
          <div style={{ padding: 20 }}>
            <BlockStack gap="400">

              <Select
                label="Select Method"
                value={method}
                onChange={setMethod}
                options={[
                  { label: "Only Generate Barcode", value: "generate_barcode" },
                  { label: "Only Generate SKU", value: "generate_sku" },
                  { label: "Only Print Labels", value: "print" },
                  { label: "Generate Barcode & Print Labels", value: "generate_print" },
                ]}
              />

              <Select
                label="Select Template"
                value={template}
                onChange={setTemplate}
                options={[
                  { label: "Select Template", value: "" },
                  ...templates.map((t) => ({
                    label: t.name,
                    value: t.id.toString(),
                  })),
                ]}
              />

              <InlineStack gap="300">
                <Button variant="primary" onClick={chooseProducts}>
                  Choose Products
                </Button>

                <Button onClick={() => setPreviewOpen(true)}>
                  Print Preview
                </Button>
              </InlineStack>

              <div style={{ marginTop: 15 }}>
                <Button variant="primary" onClick={generateBarcode} loading={loading}>
                  Save History
                </Button>
              </div>

            </BlockStack>
          </div>
        </Card>

        {/*PRODUCTS LIST*/}
        <Card>
          <div style={{ padding: 20 }}>
            <Text variant="headingMd">Selected Products</Text>

            <div style={{ marginTop: 15 }}>
              {products.length === 0 ? (
                <Text tone="subdued">No products selected</Text>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <InlineStack align="space-between">
                      <Text>{product.title}</Text>
                      <Badge>Product</Badge>
                    </InlineStack>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/*PREVIEW MODAL*/}
        <Modal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title="Label Preview"
          large
        >
          <Modal.Section>

            <div ref={printRef}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "20px",
                }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      border: "1px solid #ddd",
                      padding: 15,
                      textAlign: "center",
                    }}
                  >
                    <h3>{product.title}</h3>

                    <Barcode
                      value={product.id.split("/").pop()}
                      width={1.5}
                      height={50}
                    />

                    <p>Shopify Product</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <InlineStack gap="300">
                <Button variant="primary" onClick={downloadPDF}>
                  Download PDF
                </Button>

                <Button onClick={handlePrint}>
                  Print Labels
                </Button>
              </InlineStack>
            </div>

          </Modal.Section>
        </Modal>

        {/*HISTORY MODALS */}
        <GenerateHistoryModal
          open={generateHistoryOpen}
          onClose={() => setGenerateHistoryOpen(false)}
        />

        <PrintHistoryModal
          open={printHistoryOpen}
          onClose={() => setPrintHistoryOpen(false)}
        />

      </BlockStack>
    </Page>
  );
}