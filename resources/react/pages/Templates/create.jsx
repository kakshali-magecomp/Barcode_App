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
  Box,
  DropZone,
  Thumbnail,
  Banner,
  Spinner,
} from "@shopify/polaris";
import Barcode from "react-barcode";
import QRCode from "react-qr-code";
import { useNavigate } from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";
export default function CreateTemplate() {

  const navigate = useNavigate();
  const shopify = useAppBridge();
  //state
  const [loading, setLoading] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [form, setForm] = useState({

    name: "",
    description: "",
    note: "",
    template_type: "barcode",
    paper_brand: "",
    paper_model: "",
    paper_size: "",
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

  //update file
  const updateField = (field, value) => {

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setIsDirty(true);

  };

  //image upload

  const handleDropZoneDrop = (_dropFiles, acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsDirty(true);
  };

  //save bar

  useEffect(() => {
    if (isDirty) {
      shopify.saveBar.show("template-save-bar");
    } else {
      shopify.saveBar.hide("template-save-bar");
    }
  }, [isDirty]);

  //product priview
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch("/api/products");
      const result = await response.json();
      if (result.success) {
        setProducts(result.data);
        if (result.data.length > 0) {
          setSelectedProduct(result.data[0]);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  //change preview product
  const handleProductChange = (id) => {
    const product = products.find(
      (item) => String(item.id) === String(id)
    );
    if (product) {
      setSelectedProduct(product);
    }
  };

  //shopify resource Picker
  const chooseProduct = async () => {
    try {
      const selection = await shopify.resourcePicker({
        type: "product",
        multiple: false,
      });

      if (!selection) return;
      const picked = selection[0];
      setSelectedProduct({
        id: picked.id,
        title: picked.title,
        handle: picked.handle,
        featuredImage: picked.images?.[0]?.originalSrc,
        images: picked.images,
        variants: picked.variants,
      });

    } catch (err) {
      console.log(err);
    }
  };

  //save tamplate
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (typeof form[key] === "boolean") {
          formData.append(
            key,
            form[key] ? 1 : 0
          );
        } else {
          formData.append(
            key,
            form[key]
          );
        }
      });

      if (imageFile) {
        formData.append(
          "template_image",
          imageFile
        );
      }

      const response = await fetch(
        "/api/templates",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        shopify.toast.show(
          "Template created successfully"
        );
        setToastActive(true);
        setIsDirty(false);
        setTimeout(() => {
          navigate("/Templateslist");
        }, 1200);

      } else {
        shopify.toast.show(result.message, {
          isError: true,
        });
      }

    } catch (err) {

      console.log(err);

      shopify.toast.show(
        "Unable to save template",
        {
          isError: true,
        }
      );

    } finally {

      setLoading(false);

    }

  };

  //preview values
  const previewTitle =
    selectedProduct?.title || "Sample Product";

  const previewSku =
    selectedProduct?.variants?.[0]?.sku ||
    "SKU-001";

  const previewPrice =
    selectedProduct?.variants?.[0]?.price ||
    "99.99";

  const previewBarcode =
    selectedProduct?.variants?.[0]?.barcode ||
    previewSku ||
    "123456789";

  const previewQR =
    selectedProduct?.handle
      ? `${window.location.origin}/products/${selectedProduct.handle}`
      : "https://shopify.com";

  const previewImage =
    selectedProduct?.featuredImage ||
    selectedProduct?.images?.[0]?.originalSrc ||
    imagePreview;

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
        subtitle="Create beautiful barcode or image templates."
        backAction={{
          content: "Templates",
          onAction: () => navigate("/Templateslist"),
        }}
      >
        <Layout>

          {/* Hero Section */}

          <Layout.Section>
            <Card>
              <Box
                padding="600"
                background="bg-fill-brand"
                borderRadius="300"
              >
                <BlockStack gap="300">
                  <Text
                    variant="heading2xl"
                    as="h1"
                    tone="text-inverse"
                  >
                    Create Label Template
                  </Text>

                  <Text
                    variant="bodyLg"
                    tone="text-inverse"
                  >
                    Design barcode or image label templates with live preview.
                  </Text>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>

          {/* General Information */}

          <Layout.Section>
            <Card>
              <Box padding="500">
                <BlockStack gap="500">

                  <Text
                    variant="headingLg"
                    as="h2"
                  >
                    General Information
                  </Text>

                  <FormLayout>

                    <TextField
                      label="Template Name"
                      value={form.name}
                      onChange={(value) =>
                        updateField("name", value)
                      }
                      autoComplete="off"
                    />

                    <TextField
                      label="Description"
                      multiline={4}
                      value={form.description}
                      onChange={(value) =>
                        updateField("description", value)
                      }
                    />

                    <TextField
                      label="Internal Note"
                      multiline={3}
                      value={form.note}
                      onChange={(value) =>
                        updateField("note", value)
                      }
                    />

                    <Select
                      label="Template Type"
                      value={form.template_type}
                      onChange={(value) =>
                        updateField("template_type", value)
                      }
                      options={[
                        {
                          label: "Barcode Template",
                          value: "barcode",
                        },
                        {
                          label: "Image Template",
                          value: "image",
                        },
                      ]}
                    />

                  </FormLayout>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>

          {/* Upload Image */}

          {form.template_type === "image" && (
            <Layout.Section>
              <Card>
                <Box padding="500">
                  <BlockStack gap="400">

                    <Text variant="headingLg">
                      Upload Template Image
                    </Text>

                    <Banner tone="info">
                      Upload PNG, JPG or WEBP image.
                    </Banner>

                    <DropZone
                      allowMultiple={false}
                      accept="image/*"
                      onDrop={handleDropZoneDrop}
                    >
                      <DropZone.FileUpload />
                    </DropZone>

                    {imagePreview && (
                      <Thumbnail
                        source={imagePreview}
                        alt="Preview"
                        size="large"
                      />
                    )}

                  </BlockStack>
                </Box>
              </Card>
            </Layout.Section>
          )}

          {/* paper setting */}

          <Layout.Section>
            <Card>
              <Box padding="500">
                <BlockStack gap="500">

                  <Text variant="headingLg">
                    Paper Settings
                  </Text>

                  <InlineGrid columns={2} gap="400">

                    <Select
                      label="Paper Brand"
                      value={form.paper_brand}
                      onChange={(value) =>
                        updateField("paper_brand", value)
                      }
                      options={[
                        { label: "Select Brand", value: "" },
                        { label: "Brother", value: "Brother" },
                        { label: "Dymo", value: "Dymo" },
                        { label: "Zebra", value: "Zebra" },
                        { label: "Avery", value: "Avery" },
                      ]}
                    />

                    <Select
                      label="Paper Model"
                      value={form.paper_model}
                      onChange={(value) =>
                        updateField("paper_model", value)
                      }
                      options={[
                        { label: "Select Model", value: "" },
                        { label: "DK-11201", value: "DK-11201" },
                        { label: "DK-11202", value: "DK-11202" },
                        { label: "DK-22205", value: "DK-22205" },
                      ]}
                    />

                  </InlineGrid>

                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>

         {/* label size */}

          <Layout.Section>
            <Card>
              <Box padding="500">

                <BlockStack gap="500">

                  <Text variant="headingLg">
                    Label Size
                  </Text>

                  <InlineGrid columns={2} gap="400">

                    <TextField
                      label="Width (mm)"
                      type="number"
                      value={form.label_width}
                      onChange={(value) =>
                        updateField("label_width", value)
                      }
                      autoComplete="off"
                    />

                    <TextField
                      label="Height (mm)"
                      type="number"
                      value={form.label_height}
                      onChange={(value) =>
                        updateField("label_height", value)
                      }
                      autoComplete="off"
                    />

                  </InlineGrid>

                </BlockStack>

              </Box>
            </Card>
          </Layout.Section>


          {/* contect setting */}
          <Layout.Section>
            <Card>
              <Box padding="500">

                <BlockStack gap="400">

                  <Text variant="headingLg">
                    Content Settings
                  </Text>

                  <InlineGrid columns={2} gap="400">

                    <Checkbox
                      label="Show Product Name"
                      checked={form.show_product_name}
                      onChange={(v) =>
                        updateField("show_product_name", v)
                      }
                    />

                    <Checkbox
                      label="Show SKU"
                      checked={form.show_sku}
                      onChange={(v) =>
                        updateField("show_sku", v)
                      }
                    />

                    <Checkbox
                      label="Show Price"
                      checked={form.show_price}
                      onChange={(v) =>
                        updateField("show_price", v)
                      }
                    />

                    <Checkbox
                      label="Show Barcode"
                      checked={form.show_barcode}
                      onChange={(v) =>
                        updateField("show_barcode", v)
                      }
                    />

                    <Checkbox
                      label="Show QR Code"
                      checked={form.show_qrcode}
                      onChange={(v) =>
                        updateField("show_qrcode", v)
                      }
                    />

                  </InlineGrid>

                </BlockStack>

              </Box>
            </Card>
          </Layout.Section>

          {/* product picker */}

          <Layout.Section>
            <Button variant="primary" onClick={chooseProduct}>
              Choose Preview Product
            </Button>
          </Layout.Section>


          {/* live priview */}
          <Layout.Section>
            <Card>
              <Box padding="600">

                <BlockStack gap="500">

                  <Text variant="headingLg">
                    Live Preview
                  </Text>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      background: "#f6f6f7",
                      border: "2px dashed #dfe3e8",
                      borderRadius: 12,
                      padding: 40,
                    }}
                  >

                    <div
                      style={{
                        width: Number(form.label_width) * 4,
                        minHeight: Number(form.label_height) * 4,
                        background: "#fff",
                        paddingTop: Number(form.padding_top),
                        paddingBottom: Number(form.padding_bottom),
                        paddingLeft: Number(form.padding_left),
                        paddingRight: Number(form.padding_right),
                        marginTop: Number(form.margin_top),
                        marginBottom: Number(form.margin_bottom),
                        marginLeft: Number(form.margin_left),
                        marginRight: Number(form.margin_right),
                        border: "1px solid #ddd",
                        borderRadius: 10,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 10,
                        transition: ".3s",
                      }}
                    >

                      {previewImage && (
                        <img
                          src={previewImage}
                          alt=""
                          style={{
                            width: 90,
                            height: 90,
                            objectFit: "contain",
                          }}
                        />
                      )}

                      {form.show_product_name && (
                        <Text variant="headingMd">
                          {previewTitle}
                        </Text>
                      )}

                      {form.show_sku && (
                        <Text tone="subdued">
                          SKU : {previewSku}
                        </Text>
                      )}

                      {form.show_barcode && (
                        <Barcode
                          value={previewSku || "123456789"}
                          width={1.8}
                          height={45}
                          displayValue
                        />
                      )}

                      {form.show_qrcode && (
                        <QRCode
                          value={previewSku || "123456789"}
                          size={100}
                        />
                      )}

                      {form.show_price && (
                        <Text
                          variant="headingLg"
                          tone="success"
                        >
                          ₹ {previewPrice}
                        </Text>
                      )}

                    </div>

                  </div>

                </BlockStack>

              </Box>
            </Card>
          </Layout.Section>

          {/* save */}
          {/* <Layout.Section>
            <Card>

              <Box padding="500">

                <Button
                  variant="primary"
                  size="large"
                  loading={loading}
                  onClick={handleSubmit}
                >
                  Save Template
                </Button>

              </Box>

            </Card>
          </Layout.Section> */}

        </Layout>

        {toastActive && (
          <Toast
            content="Template created successfully"
            onDismiss={() => setToastActive(false)}
          />
        )}

      </Page>

    </>
  );
}
