import React, { useEffect, useState } from "react";
import {
  Modal,
  IndexTable,
  Spinner,
  Text,
} from "@shopify/polaris";

export default function GenerateHistoryModal({
  open,
  onClose,
}) {
  const [loading, setLoading] =
    useState(true);

  const [histories, setHistories] =
    useState([]);

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/label-history"
      );

      const result =
        await response.json();

      setHistories(
        result.data.filter(
          (item) =>
            item.type === "generate"
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate History"
      large
    >
      <Modal.Section>
        {loading ? (
          <Spinner size="large" />
        ) : histories.length === 0 ? (
          <Text>No history found</Text>
        ) : (
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
            {histories.map(
              (history, index) => (
                <IndexTable.Row
                  id={String(history.id)}
                  key={history.id}
                  position={index}
                >
                  <IndexTable.Cell>
                    {history.id}
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    {
                      history.template_name
                    }
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    {
                      history.product_count
                    }
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    {new Date(
                      history.created_at
                    ).toLocaleString()}
                  </IndexTable.Cell>
                </IndexTable.Row>
              )
            )}
          </IndexTable>
        )}
      </Modal.Section>
    </Modal>
  );
}