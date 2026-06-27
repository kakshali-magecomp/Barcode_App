import React, { useEffect, useState } from "react";
import {
  Page,
  Card,
  BlockStack,
  ContextualSaveBar,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import MethodSelector from "../../components/generateprint/MethodSelector";
import TemplateSelector from "../../components/generateprint/TemplateSelector";
import ProductSelector from "../../components/generateprint/ProductSelector";
import HistoryModal from "../../components/generateprint/HistoryModal";

export default function GeneratePrint() {
  const shopify = useAppBridge();

  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [method, setMethod] = useState("generate_barcode");
  const [generateOption, setGenerateOption] = useState("empty");

  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState("");

  const [products, setProducts] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isDirty) {
      shopify.saveBar.show("generate-save-bar");
    } else {
      shopify.saveBar.hide("generate-save-bar");
    }
  }, [isDirty]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/templates");

      const result = await response.json();

      const list = result.data || [];

      setTemplates(list);

      if (list.length) {
        setTemplate(String(list[0].id));
      }
    } catch (err) {
      console.error(err);

      shopify.toast.show("Failed to load templates", {
        isError: true,
      });
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
        setIsDirty(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeProduct = (id) => {
    setProducts((prev) =>
      prev.filter((p) => p.id !== id)
    );

    setIsDirty(true);
  };

  const saveHistory = async () => {
    if (!template) {
      shopify.toast.show("Please select template", {
        isError: true,
      });

      return;
    }

    if (!products.length) {
      shopify.toast.show("Please select products", {
        isError: true,
      });

      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/label-history", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          type:
            method === "print"
              ? "print"
              : "generate",

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

      if (!response.ok || !result.success) {
        throw new Error(result.message);
      }

      shopify.toast.show("History saved successfully");

      setIsDirty(false);
    } catch (err) {
      console.error(err);

      shopify.toast.show(
        err.message || "Something went wrong",
        {
          isError: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
  <ui-save-bar id="generate-save-bar">
    <button
      variant="primary"
      onClick={saveHistory}
    >
      Save
    </button>

    <button
      onClick={() => {
        setIsDirty(false);
      }}
    >
      Discard
    </button>
  </ui-save-bar>

    <Page
      title="Generate & Print Labels"
      secondaryActions={[
        {
          content: "History",
          onAction: () => setHistoryOpen(true),
        },
      ]}
    >
      {/* {showSaveBar && (
        <ContextualSaveBar
          message="Unsaved changes"
          saveAction={{
            onAction: saveHistory,
            loading,
          }}
          discardAction={{
            onAction: () => {
              setIsDirty(false);

              shopify.toast.show("Changes discarded");
            },
          }}
        />
      )} */}

      <BlockStack gap="500">
        <Card>
          <div style={{ padding: 20 }}>
            <BlockStack gap="500">
              <MethodSelector
                method={method}
                setMethod={(value) => {
                  setMethod(value);
                  setIsDirty(true);
                }}
                generateOption={generateOption}
                setGenerateOption={(value) => {
                  setGenerateOption(value);
                  setShowSaveBar(true);
                }}
              />

              <TemplateSelector
                templates={templates}
                template={template}
                setTemplate={(value) => {
                  setTemplate(value);
                  setShowSaveBar(true);
                }}
              />
            </BlockStack>
          </div>
        </Card>

        <ProductSelector
          products={products}
          chooseProducts={chooseProducts}
          removeProduct={removeProduct}
        />

        <HistoryModal
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
      </BlockStack>
    </Page>
    </>
  );
}