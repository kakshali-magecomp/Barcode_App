import React, { useEffect, useState, useCallback } from "react";
import {
  Page,
  Card,
  IndexTable,
  Text,
  Badge,
  Spinner,
  Box,
  Button,
  EmptyState,
  Banner,
  Modal,
  Toast,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function LabelHistory() {
  const appBridge = useAppBridge();
  const fetch = appBridge.fetch || window.fetch;

  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState([]);
  const [error, setError] = useState("");

  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/label-history");

      const json = await res.json();

      if (json.success) {
        setHistories(json.data);
      } else {
        setError(json.message || "Failed to load history.");
      }
    } catch (err) {
      setError("Unable to load print history.");
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const deleteHistory = async () => {
    if (!selectedHistory) return;

    try {
      const res = await fetch(
        `/api/label-history/${selectedHistory.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (json.success) {
        setToastMessage("History deleted.");
        setToastActive(true);
        loadHistory();
      } else {
        setError(json.message);
      }
    } catch {
      setError("Delete failed.");
    }

    setDeleteModal(false);
    setSelectedHistory(null);
  };

  if (loading) {
    return (
      <Box padding="1200" align="center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <>
      <Page title="Print History">
        {error && (
          <Box paddingBlockEnd="400">
            <Banner tone="critical">
              <p>{error}</p>
            </Banner>
          </Box>
        )}

        <Card padding="0">
          {histories.length === 0 ? (
            <EmptyState
              heading="No labels printed yet"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>
                Print your first barcode label and it will appear here.
              </p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={{
                singular: "history",
                plural: "histories",
              }}
              itemCount={histories.length}
              selectable={false}
              headings={[
                { title: "Product" },
                { title: "SKU" },
                { title: "Template" },
                { title: "Quantity" },
                { title: "Printed At" },
                { title: "Action" },
              ]}
            >
              {histories.map((item, index) => (
                <IndexTable.Row
                  id={String(item.id)}
                  key={item.id}
                  position={index}
                >
                  <IndexTable.Cell>
                    <Text as="span" fontWeight="bold">
                      {item.product_title}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Badge>{item.sku}</Badge>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    {item.template?.template_name || "-"}
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    {item.quantity}
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    {new Date(item.printed_at).toLocaleString()}
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Button
                      tone="critical"
                      onClick={() => {
                        setSelectedHistory(item);
                        setDeleteModal(true);
                      }}
                    >
                      Delete
                    </Button>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}
        </Card>

        {toastActive && (
          <Toast
            content={toastMessage}
            onDismiss={() => setToastActive(false)}
          />
        )}
      </Page>

      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete History"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: deleteHistory,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setDeleteModal(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete this print history?
          </Text>
        </Modal.Section>
      </Modal>
    </>
  );
}