import React from "react";
import {
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Box,
  Text,
  BlockStack,
} from "@shopify/polaris";

export default function SymbolControls({ design, handleUpdate }) {
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

        <div style={{ color: "#6d7175" }}>⇅</div>
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
              options={[
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
              ]}
              value={design.symbol_field_source}
              onChange={(value) =>
                handleUpdate(
                  "symbol_field_source",
                  value
                )
              }
            />

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

                <Select
                  label="Barcode Format"
                  options={[
                    {
                      label: "Code 128",
                      value: "CODE128",
                    },
                    {
                      label: "Code 39",
                      value: "CODE39",
                    },
                  ]}
                  value={
                    design.symbol_barcode_format ||
                    "CODE128"
                  }
                  onChange={(value) =>
                    handleUpdate(
                      "symbol_barcode_format",
                      value
                    )
                  }
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
              </BlockStack>
            ) : (
              <BlockStack gap="300">
                <Select
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
                />

                <Select
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
                />

                <FormLayout.Group>
                  <TextField
                    label="Width (px)"
                    value={String(
                      design.symbol_width_px || 140
                    )}
                    onChange={(value) =>
                      handleUpdate(
                        "symbol_width_px",
                        Number(value)
                      )
                    }
                    autoComplete="off"
                  />

                  <TextField
                    label="Margin (px)"
                    value={String(
                      design.symbol_margin_px || 1
                    )}
                    onChange={(value) =>
                      handleUpdate(
                        "symbol_margin_px",
                        Number(value)
                      )
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