import React from "react";
import {
  Modal,
  Text,
  BlockStack,
  InlineGrid,
  Badge,
} from "@shopify/polaris";

import Barcode from "react-barcode";
import QRCode from "react-qr-code";

export default function TemplatePreviewModal({
  open,
  onClose,
  template,
}) {
  if (!template) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={template.name}
      large
    >
      <Modal.Section>

        <BlockStack gap="500">

          <InlineGrid columns={2} gap="500">

            <div>
              <Text variant="headingMd">
                Barcode Preview
              </Text>

              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <Barcode
                  value={`TEMP-${template.id}`}
                  width={1.5}
                  height={50}
                />
              </div>
            </div>

            <div>
              <Text variant="headingMd">
                QR Code Preview
              </Text>

              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <QRCode
                  value={`Template:${template.name}`}
                  size={120}
                />
              </div>
            </div>

          </InlineGrid>

          <Text variant="headingMd">
            Template Information
          </Text>

          <InlineGrid columns={2} gap="400">

            <div>
              <Text fontWeight="bold">
                Name
              </Text>
              <Text>{template.name}</Text>
            </div>

            <div>
              <Text fontWeight="bold">
                Paper Size
              </Text>
              <Text>
                {template.paper_size || "-"}
              </Text>
            </div>

            <div>
              <Text fontWeight="bold">
                Paper Brand
              </Text>
              <Text>
                {template.paper_brand || "-"}
              </Text>
            </div>

            <div>
              <Text fontWeight="bold">
                Paper Model
              </Text>
              <Text>
                {template.paper_model || "-"}
              </Text>
            </div>

            <div>
              <Text fontWeight="bold">
                Template Type
              </Text>

              <Badge>
                {template.template_type || "Barcode"}
              </Badge>
            </div>

            <div>
              <Text fontWeight="bold">
                Label Size
              </Text>

              <Text>
                {template.label_width} ×{" "}
                {template.label_height}
              </Text>
            </div>

          </InlineGrid>

          {template.description && (
            <>
              <Text variant="headingMd">
                Description
              </Text>

              <Text>
                {template.description}
              </Text>
            </>
          )}

          {template.note && (
            <>
              <Text variant="headingMd">
                Note
              </Text>

              <Text>
                {template.note}
              </Text>
            </>
          )}

        </BlockStack>

      </Modal.Section>
    </Modal>
  );
}