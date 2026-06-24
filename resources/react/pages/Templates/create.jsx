import React, { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  BlockStack,
  Checkbox,
  Toast,
  InlineGrid,
  Text,
} from "@shopify/polaris";

import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function CreateTemplate() {
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const [toastActive, setToastActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    note: "",

    paper_brand: "",
    paper_model: "",

    template_type: "barcode",

    label_width: "60",
    label_height: "40",

    padding_top: "5",
    padding_bottom: "5",
    padding_left: "5",
    padding_right: "5",

    margin_top: "5",
    margin_bottom: "5",
    margin_left: "5",
    margin_right: "5",

    show_product_name: true,
    show_price: true,
    show_sku: true,
    show_barcode: true,
    show_qrcode: false,
  });

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setIsDirty(true);
  };

  useEffect(() => {
    if (isDirty) {
      shopify.saveBar.show("template-save-bar");
    } else {
      shopify.saveBar.hide("template-save-bar");
    }
  }, [isDirty]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (result.success) {
        setToastActive(true);
        setIsDirty(false);

        shopify.toast.show(
          "Template created successfully"
        );

        setTimeout(() => {
          navigate("/Templateslist");
        }, 1000);
      } else {
        shopify.toast.show(result.message, {
          isError: true,
        });
      }
    } catch (error) {
      console.error(error);

      shopify.toast.show("Failed to save template", {
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ui-save-bar id="template-save-bar">
        <button variant="primary" onClick={handleSubmit}>
          Save
        </button>

        <button onClick={() => setIsDirty(false)}>
          Discard
        </button>
      </ui-save-bar>

      <Page
        title="Create Template"
        backAction={{
          content: "Templates",
          onAction: () =>
            navigate("/Templateslist"),
        }}
      >
        <Layout>

          <Layout.Section>
            <Card>
              <div style={{ padding: 20 }}>
                <BlockStack gap="400">

                  <Text variant="headingMd">
                    General Information
                  </Text>

                  <FormLayout>

                    <TextField
                      label="Template Name"
                      value={form.name}
                      onChange={(v) =>
                        updateField("name", v)
                      }
                    />

                    <TextField
                      label="Description"
                      multiline={4}
                      value={form.description}
                      onChange={(v) =>
                        updateField(
                          "description",
                          v
                        )
                      }
                    />

                    <TextField
                      label="Note"
                      multiline={3}
                      value={form.note}
                      onChange={(v) =>
                        updateField("note", v)
                      }
                    />

                  </FormLayout>

                </BlockStack>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ padding: 20 }}>
                <BlockStack gap="400">

                  <Text variant="headingMd">
                    Paper Settings
                  </Text>

                  <Select
                    label="Paper Brand"
                    value={form.paper_brand}
                    onChange={(v) =>
                      updateField(
                        "paper_brand",
                        v
                      )
                    }
                    options={[
                      {
                        label: "Dymo",
                        value: "Dymo",
                      },
                      {
                        label: "Brother",
                        value: "Brother",
                      },
                      {
                        label: "Zebra",
                        value: "Zebra",
                      },
                    ]}
                  />

                  <Select
                    label="Paper Model"
                    value={form.paper_model}
                    onChange={(v) =>
                      updateField(
                        "paper_model",
                        v
                      )
                    }
                    options={[
                      {
                        label: "DK-11201",
                        value: "DK-11201",
                      },
                      {
                        label: "DK-11202",
                        value: "DK-11202",
                      },
                    ]}
                  />

                </BlockStack>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ padding: 20 }}>
                <BlockStack gap="400">

                  <Text variant="headingMd">
                    Label Size
                  </Text>

                  <InlineGrid columns={2} gap="400">
                    <TextField
                      label="Width (mm)"
                      value={form.label_width}
                      onChange={(v) =>
                        updateField(
                          "label_width",
                          v
                        )
                      }
                    />

                    <TextField
                      label="Height (mm)"
                      value={form.label_height}
                      onChange={(v) =>
                        updateField(
                          "label_height",
                          v
                        )
                      }
                    />
                  </InlineGrid>

                </BlockStack>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ padding: 20 }}>
                <BlockStack gap="400">

                  <Text variant="headingMd">
                    Content Settings
                  </Text>

                  <Checkbox
                    label="Show Product Name"
                    checked={form.show_product_name}
                    onChange={(v) =>
                      updateField(
                        "show_product_name",
                        v
                      )
                    }
                  />

                  <Checkbox
                    label="Show Price"
                    checked={form.show_price}
                    onChange={(v) =>
                      updateField(
                        "show_price",
                        v
                      )
                    }
                  />

                  <Checkbox
                    label="Show SKU"
                    checked={form.show_sku}
                    onChange={(v) =>
                      updateField(
                        "show_sku",
                        v
                      )
                    }
                  />

                  <Checkbox
                    label="Show Barcode"
                    checked={form.show_barcode}
                    onChange={(v) =>
                      updateField(
                        "show_barcode",
                        v
                      )
                    }
                  />

                  <Checkbox
                    label="Show QR Code"
                    checked={form.show_qrcode}
                    onChange={(v) =>
                      updateField(
                        "show_qrcode",
                        v
                      )
                    }
                  />

                </BlockStack>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div style={{ padding: 20 }}>
                <Button
                  variant="primary"
                  loading={loading}
                  onClick={handleSubmit}
                >
                  Save Template
                </Button>
              </div>
            </Card>
          </Layout.Section>

        </Layout>

        {toastActive && (
          <Toast
            content="Template created successfully"
            onDismiss={() =>
              setToastActive(false)
            }
          />
        )}
      </Page>
    </>
  );
}