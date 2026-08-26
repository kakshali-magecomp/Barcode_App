import React, { useEffect, useRef } from "react";
import { Card, FormLayout, TextField, Select, Checkbox, Box, Text, BlockStack, } from "@shopify/polaris";

export default function SymbolControls({ design, handleUpdate, barcodeSettings, }) {
  const barcodeFormat = design.barcode_format ||
    barcodeSettings?.barcode_format ||
    "CODE128";
  const firstLoad = useRef(true);
  const fieldOptions = [
    {
      label: "Barcode Value",
      value: "barcode_value",
    },
    {
      label: "SKU",
      value: "sku_value",
    },
    {
      label: "Product Name",
      value: "product_name",
    },
    {
      label: "Product Price",
      value: "product_price",
    },
    {
      label: "Product Page URL",
      value: "product_online_url",
    },
  ];

  const allowedFields = {
    CODE128: [
      "barcode_value",
      "sku_value",
      "product_name",
      "product_price",
      "product_online_url",
    ],

    CODE39: [
      "barcode_value",
    ],

    QR: [
      "barcode_value",
      "sku_value",
      "product_name",
      "product_price",
      "product_online_url",
    ],

    EAN8: [
      "barcode_value",
    ],

    EAN13: [
      "barcode_value",
    ],

    UPCA: [
      "barcode_value",
    ],

    ITF14: [
      "barcode_value",
    ],
  };

  useEffect(() => {

    if (firstLoad.current) return;
    const validFields = allowedFields[barcodeFormat];
    if (!validFields) return;
    if (
      !validFields.includes(design.symbol_field_source)
    ) {
      handleUpdate(
        "symbol_field_source",
        validFields[0]
      );
    }

  }, [barcodeFormat, design.symbol_field_source]);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    switch (barcodeFormat) {

      case "EAN8":
        handleUpdate("symbol_bar_width", 1.5);
        handleUpdate("symbol_bar_height", 40);
        handleUpdate("symbol_font_size", 12);
        handleUpdate("symbol_margin_px", 8);
        break;

      case "EAN13":
        handleUpdate("symbol_bar_width", 2);
        handleUpdate("symbol_bar_height", 55);
        handleUpdate("symbol_font_size", 14);
        handleUpdate("symbol_margin_px", 10);
        break;

      case "UPCA":
        handleUpdate("symbol_bar_width", 2);
        handleUpdate("symbol_bar_height", 55);
        handleUpdate("symbol_font_size", 14);
        handleUpdate("symbol_margin_px", 10);
        break;

      case "ITF14":
        handleUpdate("symbol_bar_width", 2.5);
        handleUpdate("symbol_bar_height", 70);
        handleUpdate("symbol_font_size", 16);
        handleUpdate("symbol_margin_px", 10);
        break;

      case "CODE39":
        handleUpdate("symbol_bar_width", 2);
        handleUpdate("symbol_bar_height", 50);
        handleUpdate("symbol_font_size", 14);
        handleUpdate("symbol_margin_px", 5);
        break;

      default:
        handleUpdate("symbol_bar_width", 2);
        handleUpdate("symbol_bar_height", 35);
        handleUpdate("symbol_font_size", 12);
        handleUpdate("symbol_margin_px", 5);
    }

  }, [barcodeFormat]);
  return (
    <Card padding="400">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        paddingBlockEnd="300"
        style={{ borderBottom: "1px solid #bbc3c9" }}
      >
        <Text variant="headingSm" as="h3">
          Barcode Line: 1 limited
        </Text>

        <div style={{ color: "#6d7175" }}></div>
      </Box>

      <BlockStack gap="300" paddingTop="300">
        <Checkbox
          label="Symbol"
          checked={!!design.symbol_enabled}
          onChange={(value) =>
            handleUpdate("symbol_enabled", value)
          }
        />

        {design.symbol_enabled && (
          <FormLayout>
            <Select
              label="Type"
              options={[
                {
                  label: "Barcode",
                  value: "BARCODE",
                },
                {
                  label: "QR Code",
                  value: "QR",
                },
              ]}
              value={design.symbol_type}
              onChange={(value) =>
                handleUpdate("symbol_type", value)
              }
            />
            <FormLayout.Group>
              {/* Symbol Color */}

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    marginBottom: 4,
                  }}
                >
                  Symbol Color
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="color"
                    value={design.symbol_color || "#000000"}
                    onChange={(e) =>
                      handleUpdate(
                        "symbol_color",
                        e.target.value
                      )
                    }
                    style={{
                      width: 40,
                      height: 32,
                      cursor: "pointer",
                    }}
                  />

                  <TextField
                    value={design.symbol_color || "#000000"}
                    onChange={(value) =>
                      handleUpdate(
                        "symbol_color",
                        value
                      )
                    }
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Field */}

              <Select
                label="Field"
                options={
                  design.symbol_type === "QR"
                    ? fieldOptions
                    : fieldOptions.filter(option =>
                      allowedFields[barcodeFormat]?.includes(option.value)
                    )
                }
                value={design.symbol_field_source}
                onChange={(value) => {

                  handleUpdate("symbol_field_source", value);
                  if (
                    value !== "barcode_value" &&
                    ["EAN8", "EAN13", "UPCA", "ITF14"].includes(design.barcode_format)
                  ) {
                    handleUpdate("barcode_format", "CODE128");
                  }

                }}
              />
            </FormLayout.Group>
            {/* Barcode */}

            {design.symbol_type === "BARCODE" ? (
              <BlockStack gap="300">
                <Checkbox
                  label="Hide barcode value"
                  checked={
                    !!design.hide_barcode_value
                  }
                  onChange={(value) =>
                    handleUpdate(
                      "hide_barcode_value",
                      value
                    )
                  }
                />
                <FormLayout.Group>
                  <Select
                    label="Barcode Format"
                    options={
                      design.symbol_field_source === "barcode_value"
                        ? [
                          { label: "Code 128", value: "CODE128" },
                          { label: "Code 39", value: "CODE39" },
                          { label: "UPC-A", value: "UPCA" },
                          { label: "EAN 8", value: "EAN8" },
                          { label: "EAN 13", value: "EAN13" },
                          { label: "ITF-14", value: "ITF14" },
                        ]
                        : [
                          { label: "Code 128", value: "CODE128" },
                        ]
                    }
                    value={
                      design.barcode_format ||
                      barcodeSettings?.barcode_format ||
                      "CODE128"
                    }
                    onChange={(value) => {
                      console.log("Selected Format =", value);
                      handleUpdate("barcode_format", value);
                    }}
                  />

                  <TextField
                    label="Symbol Font Size"
                    type="number"
                    value={String(
                      design.symbol_font_size || 12
                    )}
                    onChange={(value) =>
                      handleUpdate(
                        "symbol_font_size",
                        Number(value)
                      )
                    }
                    autoComplete="off"
                  />
                </FormLayout.Group>
                <FormLayout.Group>
                  <TextField
                    label="Symbol Bar Width"
                    type="number"
                    value={String(
                      design.symbol_bar_width || 2
                    )}
                    onChange={(value) =>
                      handleUpdate(
                        "symbol_bar_width",
                        Number(value)
                      )
                    }
                    autoComplete="off"
                  />

                  <TextField
                    label="Symbol Bar Height"
                    type="number"
                    value={String(
                      design.symbol_bar_height || 35
                    )}
                    onChange={(value) =>
                      handleUpdate(
                        "symbol_bar_height",
                        Number(value)
                      )
                    }
                    autoComplete="off"
                  />
                </FormLayout.Group>
              </BlockStack>

            ) : (
              <BlockStack gap="300">
                <FormLayout.Group>
                  {/* <Select
                  label="Dot Type"
                  options={[
                    {
                      label: "Square",
                      value: "square",
                    },
                    {
                      label: "Rounded",
                      value: "rounded",
                    },
                  ]}
                  value={design.qr_dot_type || "square"}
                  onChange={(value) =>
                    handleUpdate(
                      "qr_dot_type",
                      value
                    )
                  }
                /> */}

                  {/* <Select
                  label="Corner Dot Type"
                  options={[
                    {
                      label: "Square",
                      value: "square",
                    },
                    {
                      label: "Dots / Circles",
                      value: "dots",
                    },
                  ]}
                  value={
                    design.qr_corner_dot_type ||
                    "square"
                  }
                  onChange={(value) =>
                    handleUpdate(
                      "qr_corner_dot_type",
                      value
                    )
                  }
                />

                <Select
                  label="Corner Square Type"
                  options={[
                    {
                      label: "Square",
                      value: "square",
                    },
                    {
                      label: "Outline Framework",
                      value: "outline",
                    },
                  ]}
                  value={
                    design.qr_corner_square_type ||
                    "square"
                  }
                  onChange={(value) =>
                    handleUpdate(
                      "qr_corner_square_type",
                      value
                    )
                  }
                /> */}
                </FormLayout.Group>
                <FormLayout.Group>
                  <TextField
                    label="Width (px)"
                    type="number"
                    value={String(design.symbol_width_px || 140)}
                    onChange={(value) =>
                      handleUpdate("symbol_width_px", Number(value))
                    }
                    autoComplete="off"
                  />

                  <TextField
                    label="Margin (px)"
                    type="number"
                    value={String(design.symbol_margin_px || 1)}
                    onChange={(value) =>
                      handleUpdate("symbol_margin_px", Number(value))
                    }
                    autoComplete="off"
                  />
                </FormLayout.Group>
              </BlockStack>
            )}
          </FormLayout>
        )}
      </BlockStack>
    </Card>
  );
}