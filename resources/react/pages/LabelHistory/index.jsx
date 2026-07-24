import React, { useEffect, useState, useCallback, useRef, } from "react";
import { DeleteIcon } from "@shopify/polaris-icons";
import { Page, Card, InlineStack, IndexTable, Text, Badge, Spinner, Box, Button, EmptyState, Banner, Modal, Toast, Frame, InlineGrid, TextField, } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useNavigate } from "react-router-dom";
import { Pagination } from "@shopify/polaris";

export default function LabelHistory() {
  const appBridge = useAppBridge();
  const fetch = appBridge.fetch || window.fetch;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  // const [deleteModal, setDeleteModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [historyDetails, setHistoryDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const printRef = useRef(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/print-history");
      const json = await res.json();
      if (json.success) {
        setHistories(json.data);
        setFilteredHistory(json.data);
      } else {
        setError(json.message || "Unable to load history.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load history.");
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!search) {
      setFilteredHistory(histories);
      return;
    }
    const result = histories.filter(item =>
      String(item.id).includes(search) ||
      (item.template_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (item.client_ip || "")
        .includes(search)
    );
    setFilteredHistory(result);
  }, [search, histories]);

  const openHistory = async (id) => {
    try {
      setLoadingDetails(true);
      const res = await fetch(`/api/print-history/${id}`);
      const json = await res.json();
      if (!json.success) {
        console.error(json.message);
        return;
      }
      const history = json.data;
      setHistoryDetails(history);
      // Select all items by default
      setSelectedItems(
        (history.items || []).map((_, index) => index)
      );
      setViewModal(true);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // const deleteHistory = async () => {
  //   if (!selectedHistory) return;
  //   try {
  //     const res = await fetch(
  //       `/api/print-history/${selectedHistory.id}`,
  //       {
  //         method: "DELETE",
  //       }
  //     );
  //     const json = await res.json();
  //     if (json.success) {
  //       setToastMessage("History deleted.");
  //       setToastActive(true);
  //       loadHistory();
  //     } else {
  //       setError(json.message);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     setError("Delete failed.");
  //   }
  //   setDeleteModal(false);
  //   setSelectedHistory(null);
  // };


  if (loading) {
    return (
      <Box padding="1200" align="center">
        <Spinner size="large" />
      </Box>
    );
  }

  const handlePrintHistory = () => {
  if (!historyDetails) return;

  const printWindow = window.open("", "_blank");

  const rows = historyDetails.items
    .filter((_, index) => selectedItems.includes(index))
    .map(
      (item) => `
      <tr>
        <td>${item.product_title}</td>
        <td>${item.sku}</td>
        <td>${item.barcode}</td>
        <td style="text-align:center">${item.qty}</td>
      </tr>
    `
    )
    .join("");

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Print Job #${historyDetails.id}</title>

<style>

body{
    font-family:Arial,sans-serif;
    margin:25px;
    color:#222;
}

h2{
    margin-bottom:5px;
}

.info{
    margin-bottom:20px;
    color:#666;
}

table{
    width:100%;
    border-collapse:collapse;
}

th{
    background:#f3f3f3;
    border:1px solid #ddd;
    padding:12px;
    text-align:left;
    font-weight:bold;
}

td{
    border:1px solid #ddd;
    padding:12px;
}

tbody tr:nth-child(even){
    background:#fafafa;
}

</style>

</head>

<body>

<h2>Print Job #${historyDetails.id}</h2>

<div class="info">

Template : ${historyDetails.template_id}

</div>

<table>

<thead>

<tr>

<th>Product</th>

<th>SKU</th>

<th>Barcode</th>

<th>Qty</th>

</tr>

</thead>

<tbody>

${rows}

</tbody>

</table>

<script>

window.onload=function(){

window.print();

window.close();

}

</script>

</body>

</html>
`);

  printWindow.document.close();
};
  const handlePrintAll = () => {
    const win = window.open("", "_blank");
    const rows = histories.map((item, index) => `
<tr>
<td>${item.id}</td>
<td>${item.template_id}</td>
<td>${item.print_qty}</td>
<td>${item.client_ip}</td>
<td>${new Date(item.printed_at).toLocaleString()}</td>
</tr>
`).join("");
    win.document.write(`
<html>
<head>
<title>Print History</title>
<style>
body{
font-family:Arial;
padding:30px;
}
table{
width:100%;
border-collapse:collapse;
}
th,td{
border:1px solid #ccc;
padding:10px;
}
th{
background:#f5f5f5;
}
</style>
</head>
<body>
<h2>Barcode Print History</h2>
<table>
<thead>
<tr>
<th>ID</th>
<th>Template</th>
<th>Total Qty</th>
<th>Client IP</th>
<th>Printed At</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
<script>
window.onload=function(){
window.print();
window.close();
}
</script>
</body>
</html>
`);
    win.document.close();
  };
  const summary = {
    totalPrints: filteredHistory.length,

    totalLabels: filteredHistory.reduce(
      (total, item) => total + Number(item.print_qty || 0),
      0
    ),

    todayPrints: filteredHistory.filter((item) => {
      const today = new Date().toDateString();
      return new Date(item.created_at || item.printed_at).toDateString() === today;
    }).length,

    lastPrint:
      filteredHistory.length > 0
        ? new Date(
          filteredHistory[0].created_at ||
          filteredHistory[0].printed_at
        ).toLocaleDateString()
        : "-",
  };
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedHistory = filteredHistory.slice(
    startIndex,
    endIndex
  );

  return (
    <Frame>
      <Page title="Print History"
        primaryAction={{
          content: "Print All History",
          onAction: handlePrintAll,
        }}
      >
        {error && (
          <Box paddingBlockEnd="400">
            <Banner tone="critical">
              <p>{error}</p>
            </Banner>
          </Box>
        )}
        <Box paddingBlockEnd="400">
          <InlineGrid columns={4} gap="400">
            <Card>
              <Box padding="400">
                <Text variant="headingLg">{summary.totalPrints}</Text>
                <Text>Total Prints</Text>
              </Box>
            </Card>
            <Card>
              <Box padding="400">
                <Text variant="headingLg">{summary.totalLabels}</Text>
                <Text>Total Labels</Text>
              </Box>
            </Card>
            <Card>
              <Box padding="400">
                <Text variant="headingLg">{summary.todayPrints}</Text>
                <Text>Today's Prints</Text>
              </Box>
            </Card>
            <Card>
              <Box padding="400">
                <Text variant="headingLg">{summary.lastPrint}</Text>
                <Text>Last Print</Text>
              </Box>
            </Card>
          </InlineGrid>
        </Box>
        <Card>
          <Box padding="400">
            <TextField
              labelHidden
              placeholder="Search by Print ID, Template or Client IP..."
              value={search}
              onChange={setSearch}
              autoComplete="off"
            />
          </Box>
          {filteredHistory.length === 0 ? (
            <EmptyState
              heading="No print history found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>No barcode labels have been printed yet.</p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={{
                singular: "Print History",
                plural: "Print Histories",
              }}
              itemCount={paginatedHistory.length}
              selectable={false}
              headings={[
                { title: "Print ID" },
                { title: "Template_id" },
                { title: "Total Labels" },
                { title: "Client IP" },
                { title: "Printed At" },
                // { title: "Actions" },
              ]}
            >
              {paginatedHistory.map((item, index) => (
                <IndexTable.Row
                  id={String(item.id)}
                  key={item.id}
                  position={index}
                  onClick={() => openHistory(item.id)}
                >
                  <IndexTable.Cell>
                    <Button
                      variant="plain"
                      onClick={() => openHistory(item.id)}
                    >
                      #{item.id}
                    </Button>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Text fontWeight="semibold">
                      {item.template_id}
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge tone="success">
                      {item.print_qty}
                    </Badge>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {item.client_ip}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    {new Date(item.created_at).toLocaleString()}
                  </IndexTable.Cell>

                  {/* <IndexTable.Cell>

                    <InlineStack gap="200">

                      <Button
                        size="slim"
                        onClick={() => openHistory(item.id)}
                      >
                        View
                      </Button>

                      <Button
                        icon={DeleteIcon}
                        tone="critical"
                        variant="plain"
                        onClick={() => {
                          setSelectedHistory(item);
                          setDeleteModal(true);
                        }}
                      />

                    </InlineStack>

                  </IndexTable.Cell> */}
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}
          <Box padding="400">
            <InlineStack align="center">
              <Pagination
                hasPrevious={currentPage > 1}
                onPrevious={() =>
                  setCurrentPage((prev) => prev - 1)
                }
                hasNext={currentPage < totalPages}
                onNext={() =>
                  setCurrentPage((prev) => prev + 1)
                }
              />
            </InlineStack>
          </Box>
        </Card>
        {toastActive && (
          <Toast
            content={toastMessage}
            onDismiss={() => setToastActive(false)}
          />
        )}
      </Page>
      {/* <Modal
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
      </Modal> */}
      <Modal
        open={viewModal}
        onClose={() => setViewModal(false)}
        title={`Print Job #${historyDetails?.id || ""}`}
        large
        primaryAction={{
          content: "Print",
          onAction: handlePrintHistory,
        }}
      >
        <Modal.Section>
          {loadingDetails ? (
            <Box padding="400" alignment="center">
              <Spinner />
            </Box>
          ) : (
            historyDetails && (
              <div
                ref={printRef}
                style={{
                  border: "1px solid #dfe3e8",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  className="no-print"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 18px",
                    background: "#f6f6f7",
                    borderBottom: "1px solid #dfe3e8",
                  }}
                >
                  <Text fontWeight="semibold">
                    {historyDetails.items.length} selected
                  </Text>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const selectedProducts = historyDetails.items.filter((_, index) =>
                        selectedItems.includes(index)
                      );
                      navigate("/ProductsBarcodeList", {
                        state: {
                          fromHistory: true,
                          historyId: historyDetails.id,
                          mode: "print_existing",
                          selectedProducts,
                          originalHistoryProducts: historyDetails.items,
                          templateId: historyDetails.template_id,
                          historyProducts: historyDetails.items,
                        },
                      });
                      setViewModal(false);
                    }}
                  >
                    Generate Barcode
                  </Button>
                </div>
                {/* Rows */}
                {historyDetails.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 2fr 2fr 1.5fr 80px",
                      alignItems: "center",
                      padding: "12px 18px",
                      borderBottom:
                        index !== historyDetails.items.length - 1
                          ? "1px solid #ececec"
                          : "none",
                    }}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(index)}
                      onChange={() => {
                        if (selectedItems.includes(index)) {
                          setSelectedItems(
                            selectedItems.filter(i => i !== index)
                          );
                        } else {
                          setSelectedItems([
                            ...selectedItems,
                            index,
                          ]);
                        }
                      }}
                    />
                    {/* Product */}
                    <div>
                      <Text fontWeight="semibold">
                        {item.product_title}
                      </Text>
                    </div>
                    {/* SKU */}
                    <div>
                      <Text tone="subdued">
                        {item.sku}
                      </Text>
                    </div>
                    {/* Barcode */}
                    <div>
                      <Badge tone="info">
                        {item.barcode}
                      </Badge>
                    </div>
                    {/* Qty */}
                    <div style={{ textAlign: "center" }}>
                      <Badge tone="success">
                        {item.qty}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </Modal.Section>
      </Modal>
    </Frame>
  );
}