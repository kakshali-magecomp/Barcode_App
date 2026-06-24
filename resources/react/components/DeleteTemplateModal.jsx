import React from "react";
import { Modal, Text } from "@shopify/polaris";

export default function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
  loading,
  count,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Templates"
      primaryAction={{
        content: loading ? "Deleting..." : "Delete",
        destructive: true,
        loading,
        onAction: onConfirm,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <Text as="p">
          Are you sure you want to delete{" "}
          <strong>{count}</strong> template(s)?
        </Text>

        <div style={{ marginTop: "10px" }}>
          <Text tone="subdued">
            This action cannot be undone.
          </Text>
        </div>
      </Modal.Section>
    </Modal>
  );
}