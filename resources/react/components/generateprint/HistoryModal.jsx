import React, { useEffect, useState } from "react";
import {
    Modal,
    IndexTable,
    Spinner,
    Text,
    Badge,
    Button,
    BlockStack,
    InlineStack,
    Card,
} from "@shopify/polaris";

export default function HistoryModal({
    open,
    onClose,
}) {
    const [loading, setLoading] = useState(false);
    const [histories, setHistories] = useState([]);
    const [selectedHistory, setSelectedHistory] =
        useState(null);

    useEffect(() => {
        if (open) {
            fetchHistory();
        }
    }, [open]);

    const fetchHistory = async () => {
        try {
            setLoading(true);

            const response = await fetch("/api/label-history");

            const result = await response.json();

            if (result.success) {
                setHistories(result.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const printAllHistory = () => {
        const html = `
  <html>
    <head>
      <title>All History</title>

      <style>
        body{
          font-family:Arial,sans-serif;
          padding:25px;
        }

        h1{
          text-align:center;
          margin-bottom:30px;
        }

        table{
          width:100%;
          border-collapse:collapse;
          margin-top:20px;
        }

        th,
        td{
          border:1px solid #ccc;
          padding:10px;
          text-align:left;
          vertical-align:top;
        }

        th{
          background:#f3f3f3;
        }

        ul{
          margin:0;
          padding-left:18px;
        }

        .type-generate{
          color:#008060;
          font-weight:bold;
        }

        .type-print{
          color:#005bd3;
          font-weight:bold;
        }

        @media print{
          button{
            display:none;
          }
        }
      </style>

    </head>

    <body>

      <h1>Barcode History</h1>

      <table>

        <thead>

          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Template</th>
            <th>Products</th>
            <th>Date</th>
          </tr>

        </thead>

        <tbody>

        ${histories
                .map(
                    (history) => `
          <tr>

            <td>${history.id}</td>

            <td class="type-${history.type}">
              ${history.type.toUpperCase()}
            </td>

            <td>${history.template_name}</td>

            <td>

              <ul>

                ${history.products
                            ?.map(
                                (product) =>
                                    `<li>${product.title}</li>`
                            )
                            .join("") || "-"
                        }

              </ul>

            </td>

            <td>
              ${new Date(
                            history.created_at
                        ).toLocaleString()}
            </td>

          </tr>
        `
                )
                .join("")}

        </tbody>

      </table>

    </body>

  </html>
  `;

        const printWindow = window.open("", "_blank");

        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    const deleteHistory = async (id) => {
        if (!window.confirm("Delete this history?"))
            return;

        try {
            await fetch(`/api/label-history/${id}`, {
                method: "DELETE",
            });

            fetchHistory();
        } catch (err) {
            console.log(err);
        }
    };

    const printHistory = (history) => {
        const html = `
      <html>
      <head>
        <title>Print History</title>

        <style>

        body{
          font-family:Arial;
          padding:20px;
        }

        table{
          width:100%;
          border-collapse:collapse;
        }

        td,th{
          border:1px solid #ddd;
          padding:10px;
        }

        h2{
          margin-bottom:20px;
        }

        </style>

      </head>

      <body>

      <h2>${history.template_name}</h2>

      <table>

      <tr>
      <th>Product</th>
      </tr>

      ${history.products
                .map(
                    (p) => `
          <tr>
            <td>${p.title}</td>
          </tr>
      `
                )
                .join("")}

      </table>

      </body>

      </html>
    `;

        const win = window.open("");

        win.document.write(html);

        win.document.close();

        win.print();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="History"
            large
        >
            <InlineStack align="space-between">
                <Text variant="headingMd" as="h2">
                    Total History ({histories.length})
                </Text>

                <Button
                    variant="primary"
                    onClick={printAllHistory}
                    disabled={!histories.length}
                >
                    Print All History
                </Button>
            </InlineStack>

            <Modal.Section>

                <div
                    style={{
                        maxHeight: "550px",
                        overflowY: "auto",
                        border: "1px solid #E1E3E5",
                        borderRadius: "12px",
                        background: "#fff",
                    }}
                >
                    {loading ? (
                        <div
                            style={{
                                padding: 40,
                                textAlign: "center",
                            }}
                        >
                            <Spinner size="large" />
                        </div>
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
                                { title: "Type" },
                                { title: "Template" },
                                { title: "Products" },
                                { title: "Created" },
                                { title: "Actions" },
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
                                        <Badge
                                            tone={
                                                history.type === "print"
                                                    ? "success"
                                                    : "attention"
                                            }
                                        >
                                            {history.type === "print"
                                                ? "🖨 Print"
                                                : "⚡ Generate"}
                                        </Badge>
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

                                    <IndexTable.Cell>
                                        <InlineStack
                                            gap="100"
                                            wrap={false}
                                        >
                                            <Button
                                                size="micro"
                                                variant="secondary"
                                                onClick={() =>
                                                    setSelectedHistory(history)
                                                }
                                            >
                                                👁
                                            </Button>

                                            <Button
                                                size="micro"
                                                variant="primary"
                                                onClick={() =>
                                                    printHistory(history)
                                                }
                                            >
                                                🖨
                                            </Button>

                                            <Button
                                                size="micro"
                                                tone="critical"
                                                variant="primary"
                                                onClick={() =>
                                                    deleteHistory(history.id)
                                                }
                                            >
                                                🗑
                                            </Button>
                                        </InlineStack>
                                    </IndexTable.Cell>
                                </IndexTable.Row>
                            ))}
                        </IndexTable>
                    )}
                </div>
            </Modal.Section>

            {selectedHistory && (
                <Modal
                    open={true}
                    title="History Details"
                    onClose={() =>
                        setSelectedHistory(null)
                    }
                >
                    <Modal.Section>
                        <BlockStack gap="300">
                            <Card roundedAbove="sm">
                                <BlockStack gap="400">
                                    <Text
                                        variant="headingLg"
                                        fontWeight="bold"
                                    >
                                        {selectedHistory.template_name}
                                    </Text>

                                    <Text>
                                        Type :
                                        {" "}
                                        {selectedHistory.type}
                                    </Text>

                                    <Text>
                                        Products :
                                    </Text>

                                    <BlockStack gap="200">
                                        {selectedHistory.products?.map((product) => (
                                            <div
                                                key={product.id}
                                                style={{
                                                    padding: "12px",
                                                    borderRadius: "10px",
                                                    border: "1px solid #E3E3E3",
                                                    background: "#F6F6F7",
                                                }}
                                            >
                                                <Text
                                                    fontWeight="medium"
                                                    variant="bodyMd"
                                                >
                                                    {product.title}
                                                </Text>

                                                <Text
                                                    tone="subdued"
                                                    variant="bodySm"
                                                >
                                                    {product.handle}
                                                </Text>

                                                <Text
                                                    tone="subdued"
                                                    variant="bodySm"
                                                >
                                                    {product.id}
                                                </Text>
                                            </div>
                                        ))}
                                    </BlockStack>
                                </BlockStack>
                            </Card>
                        </BlockStack>
                    </Modal.Section>
                </Modal>
            )}
        </Modal>
    );
}