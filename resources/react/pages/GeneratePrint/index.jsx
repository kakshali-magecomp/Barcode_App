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
  Spinner,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import GenerateHistoryModal from "../../components/GenerateHistoryModal";
import PrintHistoryModal from "../../components/PrintHistoryModal";

export default function GeneratePrint() {
  const shopify = useAppBridge();
  const printRef = useRef();
const [generateHistoryOpen, setGenerateHistoryOpen] =useState(false);

const [printHistoryOpen, setPrintHistoryOpen] =useState(false);
  const [loading, setLoading] = useState(false);

  const [method, setMethod] = useState("generate_print");

  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState("");

  const [products, setProducts] = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");

      const result = await response.json();

      setTemplates(result.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const chooseProducts = async () => {
    try {
      const selected = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });

      if (selected) {
        setProducts(selected);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const generateBarcode = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/barcode/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            products,
            template_id: template,
            method,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        shopify.toast.show(
          "Operation completed successfully"
        );
      }
    } catch (error) {
      console.error(error);

      shopify.toast.show(
        "Something went wrong",
        {
          isError: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = printRef.current;

    const canvas = await html2canvas(element);

    const image = canvas.toDataURL("image/png");

    const pdf = new jsPDF(
      "p",
      "mm",
      "a4"
    );

    const pdfWidth =
      pdf.internal.pageSize.getWidth();

    const pdfHeight =
      (canvas.height * pdfWidth) /
      canvas.width;

    pdf.addImage(
      image,
      "PNG",
      0,
      0,
      pdfWidth,
      pdfHeight
    );

    pdf.save("barcode-labels.pdf");
  };

  return (
    <Page
      title="Generate & Print Labels"
      primaryAction={{
        content: "Generate",
        loading,
        onAction: generateBarcode,
      }}
      secondaryActions={[
  {
    content: "Generate History",
    onAction: () =>
      setGenerateHistoryOpen(true),
  },
  {
    content: "Print History",
    onAction: () =>
      setPrintHistoryOpen(true),
  },
]}
    >
      <BlockStack gap="500">

        <Card>
          <div style={{ padding: 20 }}>
            <BlockStack gap="400">

              <Select
                label="Select Method"
                value={method}
                onChange={setMethod}
                options={[
                  {
                    label:
                      "Only Generate Barcode",
                    value:
                      "generate_barcode",
                  },
                  {
                    label:
                      "Only Generate SKU",
                    value:
                      "generate_sku",
                  },
                  {
                    label:
                      "Only Print Labels",
                    value: "print",
                  },
                  {
                    label:
                      "Generate Barcode & Print Labels",
                    value:
                      "generate_print",
                  },
                ]}
              />

              <Select
                label="Select Template"
                value={template}
                onChange={setTemplate}
                options={[
                  {
                    label:
                      "Select Template",
                    value: "",
                  },

                  ...templates.map(
                    (item) => ({
                      label: item.name,
                      value: item.id.toString(),
                    })
                  ),
                ]}
              />

              <InlineStack gap="300">
                <Button
                  variant="primary"
                  onClick={chooseProducts}
                >
                  Choose Products
                </Button>

                <Button
                  onClick={() =>
                    setPreviewOpen(true)
                  }
                >
                  Print Preview
                </Button>
              </InlineStack>

            </BlockStack>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 20 }}>
            <Text variant="headingMd">
              Selected Products
            </Text>

            <div
              style={{
                marginTop: "15px",
              }}
            >
              {products.length === 0 ? (
                <Text tone="subdued">
                  No products selected
                </Text>
              ) : (
                products.map(
                  (product) => (
                    <div
                      key={product.id}
                      style={{
                        padding: "10px",
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      <InlineStack
                        align="space-between"
                      >
                        <Text>
                          {product.title}
                        </Text>

                        <Badge>
                          Product
                        </Badge>
                      </InlineStack>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </Card>

        <Modal
          open={previewOpen}
          onClose={() =>
            setPreviewOpen(false)
          }
          title="Label Preview"
          large
        >
          <Modal.Section>

            <div ref={printRef}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2,1fr)",
                  gap: "20px",
                }}
              >
                {products.map(
                  (product, index) => (
                    <div
                      key={index}
                      style={{
                        border:
                          "1px solid #ddd",
                        padding: "15px",
                        textAlign:
                          "center",
                      }}
                    >
                      <h3>
                        {product.title}
                      </h3>

                      <Barcode
                        value={
                          product.id
                        }
                        width={1.5}
                        height={50}
                      />

                      <p>
                        Shopify Product
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
              }}
            >
              <InlineStack gap="300">

                <Button
                  variant="primary"
                  onClick={
                    downloadPDF
                  }
                >
                  Download PDF
                </Button>

                <Button
                  onClick={() =>
                    window.print()
                  }
                >
                  Print Labels
                </Button>

              </InlineStack>
            </div>

          </Modal.Section>
        </Modal>

      </BlockStack>
      
    </Page>
  );
}