import React, { useEffect, useState } from "react";
import {
  Modal,
  IndexTable,
  Spinner,
  Text,
  Button,
  BlockStack,
} from "@shopify/polaris";

export default function PrintHistoryModal({
  open,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [histories, setHistories] = useState([]);

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/label-history?type=print"
      );

      const result = await response.json();

      console.log("PRINT HISTORY:", result);

      if (result.success) {
        setHistories(result.data || []);
      } else {
        setHistories([]);
      }
    } catch (error) {
      console.error(error);
      setHistories([]);
    } finally {
      setLoading(false);
    }
  };

  const printHistory = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Print History"
      large
    >
      <Modal.Section>
        <BlockStack gap="400">
          {loading ? (
            <Spinner size="large" />
          ) : histories.length === 0 ? (
            <Text>No history found</Text>
          ) : (
            <>
              <IndexTable
                resourceName={{
                  singular: "history",
                  plural: "histories",
                }}
                itemCount={histories.length}
                selectable={false}
                headings={[
                  { title: "ID" },
                  { title: "Template" },
                  { title: "Products" },
                  { title: "Date" },
                ]}
              >
                {histories.map((history, index) => (
                  <IndexTable.Row
                    id={String(history.id)}
                    key={history.id}
                    position={index}
                  >
                    <IndexTable.Cell>
                      {history.id}
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      {history.template_name}
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      {history.product_count}
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                      {new Date(
                        history.created_at
                      ).toLocaleString()}
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ))}
              </IndexTable>

              <Button
                variant="primary"
                onClick={printHistory}
              >
                Print History
              </Button>
            </>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}