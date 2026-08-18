import React, { useEffect, useState, useCallback, useRef } from "react";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useNavigate } from "react-router-dom";
import { openPrintWindow } from '../../components/Printlayout';

const DELETE_MODAL_ID = "delete-history-modal";
const VIEW_MODAL_ID = "view-history-modal";

export default function LabelHistory() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState("");
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyDetails, setHistoryDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const printRef = useRef(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [printQuantities, setPrintQuantities] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
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
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    let result = histories;

    if (search) {
      const searchText = search.toLowerCase();
      result = result.filter((item) => {
        const formattedDate = new Date(item.created_at)
          .toLocaleString()
          .toLowerCase();

        return (
          String(item.id).includes(searchText) ||
          (item.template?.template_name || "")
            .toLowerCase()
            .includes(searchText) ||
          (item.client_ip || "")
            .toLowerCase()
            .includes(searchText) ||
          formattedDate.includes(searchText)
        );
      });
    }

    if (dateFilter) {
      result = result.filter((item) => {
        const itemDate = new Date(item.created_at).toISOString().slice(0, 10); // YYYY-MM-DD
        return itemDate === dateFilter;
      });
    }

    setFilteredHistory(result);
  }, [search, dateFilter, histories]);

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
      const quantities = {};

      json.data.items.forEach((item, index) => {
        quantities[index] = Number(item.qty) || 1;
      });

      setPrintQuantities(quantities);
      setSelectedItems((history.items || []).map((_, index) => index));
      shopify.modal.show(VIEW_MODAL_ID);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const deleteHistory = async () => {
    try {
      await Promise.all(
        selectedRows.map(id =>
          fetch(`/api/print-history/${id}`, {
            method: "DELETE",
          })
        )
      );

      shopify.toast.show("History deleted.");

      setSelectedRows([]);
      loadHistory();
    } catch (err) {
      setError("Delete failed.");
    }

    shopify.modal.hide(DELETE_MODAL_ID);
  };

  const handlePrintHistory = () => {
    if (!historyDetails) return;

    const firstSelected = historyDetails.items.find((_, index) =>
      selectedItems.includes(index)
    );

    const paper =
      firstSelected?.template_settings?.layout_settings;

    if (!paper) {
      shopify.toast.show("Paper template information is missing.");
      return;
    }

    const bodyHtml = historyDetails.items
      .map((item, index) => {
        // Only print selected products
        if (!selectedItems.includes(index)) {
          return "";
        }

        const settings = item.template_settings || {};

        let symbolValue;

        switch (settings.symbol_field_source) {
          case "sku_value":
            symbolValue = item.sku;
            break;

          case "product_name":
            symbolValue = item.product_title;
            break;

          case "product_price":
            symbolValue = item.price;
            break;

          case "product_online_url":
            symbolValue = item.online_url;
            break;

          default:
            symbolValue = item.barcode;
        }

        const decimals = Number(
          settings.price_decimal_number ?? 2
        );

        const amount = Number(
          item.price || 0
        ).toFixed(decimals);

        const priceFormat =
          settings.line2_currency_format || "{amount}";

        const formattedPrice =
          priceFormat.replace("{amount}", amount);

        const nameLine =
          settings.line2_name ||
            settings.line2_price
            ? `
                        <div>
                            ${settings.line2_name
              ? `<span>${item.product_title ?? ""}</span>`
              : ""
            }

                            ${settings.line2_price
              ? `<span>${formattedPrice}</span>`
              : ""
            }
                        </div>
                    `
            : "";

        const symbolHtml = settings.symbol_enabled
          ? (
            settings.symbol_type === "QR"
              ? `
                            <img
                                class="qr"
                                src="https://api.qrserver.com/v1/create-qr-code/?size=${settings.symbol_width_px || 140
              }x${settings.symbol_width_px || 140
              }&data=${encodeURIComponent(
                symbolValue || ""
              )}"
                            />
                        `
              : `
                            <svg
                                class="barcode"
                                data-format="${settings.barcode_format || "CODE128"
              }"
                                data-value="${String(
                symbolValue || ""
              ).trim()}"
                                data-width="${settings.symbol_bar_width || 2
              }"
                                data-height="${settings.symbol_bar_height || 45
              }"
                                data-font="${settings.symbol_font_size || 16
              }"
                                data-display="${settings.hide_barcode_value
                ? "false"
                : "true"
              }"
                                data-color="${settings.symbol_color || "#000000"
              }"
                            ></svg>
                        `
          )
          : "";
        const quantity = Math.max(
          1,
          Number(printQuantities[index]) ||
          Number(item.qty) ||
          1
        );

        let html = "";

        for (let i = 0; i < quantity; i++) {
          html += `
                    <div class="label">
                        ${settings.line1_sku
              ? `<div>${item.sku ?? ""}</div>`
              : ""
            }

                        ${nameLine}

                        ${settings.line3_vendor
              ? `<div>${item.vendor ?? ""}</div>`
              : ""
            }

                        ${symbolHtml}
                    </div>
                `;
        }

        return html;
      })
      .join("");

    if (!bodyHtml) {
      shopify.toast.show(
        "Please select at least one product."
      );
      return;
    }

    openPrintWindow({
      bodyHtml,
      paperTemplate: paper,
      useJsBarcodeScript: true,
      onAfterPrint: () => { },
    });
  };

  const handlePrintAll = () => {
    const win = window.open("", "_blank");
    const rows = histories.map((item) => `
<tr>
<td>${item.id}</td>
<td>${item.template?.template_name || "-"}</td>
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
body{font-family:Arial;padding:30px;}
table{width:100%;border-collapse:collapse;}
th,td{border:1px solid #ccc;padding:10px;}
th{background:#f5f5f5;}
</style>
</head>
<body>
<h2>Barcode Print History</h2>
<table>
<thead>
<tr><th>ID</th><th>Template</th><th>Total Qty</th><th>Client IP</th><th>Printed At</th></tr>
</thead>
<tbody>${rows}</tbody>
</table>
<script>window.onload=function(){window.print();window.close();}</script>
</body>
</html>
`);
    win.document.close();
  };

  const summary = {
    totalPrints: filteredHistory.length,
    totalLabels: filteredHistory.reduce((total, item) => total + Number(item.print_qty || 0), 0),
    todayPrints: filteredHistory.filter((item) => {
      const today = new Date().toDateString();
      return new Date(item.created_at || item.printed_at).toDateString() === today;
    }).length,
    lastPrint:
      filteredHistory.length > 0
        ? new Date(filteredHistory[0].created_at || filteredHistory[0].printed_at).toLocaleDateString()
        : "-",
  };

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  if (loading) {
    return (
      <s-page heading="Print History">
        <s-box padding="loose" alignContent="center">
          <s-spinner accessibilityLabel="Loading print history" size="large" />
        </s-box>
      </s-page>
    );
  }

  return (
    <>
      <s-page heading="Print History">
        <s-section>
          <s-button variant="primary" onClick={handlePrintAll}>
            Print All History
          </s-button>
        </s-section>

        {error && (
          <s-section>
            <s-banner tone="critical" onDismiss={() => setError("")}>
              {error}
            </s-banner>
          </s-section>
        )}

        <div style={{ margin: 10 }}>
          <s-grid gridTemplateColumns="1fr 1fr 1fr 1fr" gap="base" >
            <s-section>
              <s-heading>{summary.totalPrints}</s-heading>
              <s-text>Total Prints</s-text>
            </s-section>
            <s-section>
              <s-heading>{summary.totalLabels}</s-heading>
              <s-text>Total Labels</s-text>
            </s-section>
            <s-section>
              <s-heading>{summary.todayPrints}</s-heading>
              <s-text>Today's Prints</s-text>
            </s-section>
            <s-section>
              <s-heading>{summary.lastPrint}</s-heading>
              <s-text>Last Print</s-text>
            </s-section>
          </s-grid>
        </div>
        <s-section padding="none">
          <s-box padding="base">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "#f4f4f5",
                padding: "12px",
                borderRadius: "12px",
              }}
            >
              <div style={{ flex: 1 }}>
                <s-search-field
                  label="Search"
                  labelAccessibilityVisibility="exclusive"
                  placeholder="Search by Print ID, Template or Client IP..."
                  value={search}
                  onInput={(event) => setSearch(event.currentTarget.value)}
                />
              </div>

              <s-date-field
                label="Date"
                labelAccessibilityVisibility="exclusive"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.currentTarget.value)}
              />
            </div>
          </s-box>

          {filteredHistory.length === 0 ? (
            <s-empty-state
              heading="No print history found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <s-paragraph>No barcode labels have been printed yet.</s-paragraph>
            </s-empty-state>
          ) : (
            <>
              {selectedRows.length > 0 && (
                <s-box padding="base">
                  <s-button
                    tone="critical"
                    onClick={() => shopify.modal.show(DELETE_MODAL_ID)}
                  >
                    Delete ({selectedRows.length})
                  </s-button>
                </s-box>
              )}
              <s-table
                paginate
                hasPreviousPage={currentPage > 1 || undefined}
                hasNextPage={currentPage < totalPages || undefined}
                onPreviousPage={() => setCurrentPage((prev) => prev - 1)}
                onNextPage={() => setCurrentPage((prev) => prev + 1)}
              >
                <s-table-header-row>
                  <s-table-header>
                    <input
                      type="checkbox"
                      checked={
                        paginatedHistory.length > 0 &&
                        selectedRows.length === paginatedHistory.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(paginatedHistory.map(item => item.id));
                        } else {
                          setSelectedRows([]);
                        }
                      }}
                    />
                  </s-table-header>
                  <s-table-header>Print ID</s-table-header>
                  <s-table-header>Template Name</s-table-header>
                  <s-table-header>Total Labels</s-table-header>
                  <s-table-header>Client IP</s-table-header>
                  <s-table-header>Printed At</s-table-header>

                </s-table-header-row>
                <s-table-body>
                  {paginatedHistory.map((item) => (
                    <s-table-row key={item.id}>
                      <s-table-cell>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows([...selectedRows, item.id]);
                            } else {
                              setSelectedRows(
                                selectedRows.filter(id => id !== item.id)
                              );
                            }
                          }}
                        />
                      </s-table-cell>
                      <s-table-cell>
                        <s-button variant="tertiary" onClick={() => openHistory(item.id)}>
                          #{item.id}
                        </s-button>
                      </s-table-cell>
                      <s-table-cell>
                        <s-text fontWeight="semibold">{item.template?.template_name ?? "-"}</s-text>
                      </s-table-cell>
                      <s-table-cell>
                        <s-badge tone="success">{item.print_qty}</s-badge>
                      </s-table-cell>
                      <s-table-cell>{item.client_ip}</s-table-cell>
                      <s-table-cell>{new Date(item.created_at).toLocaleString()}</s-table-cell>
                    </s-table-row>
                  ))}
                </s-table-body>
              </s-table>
            </>
          )}
        </s-section>
      </s-page>

      <Modal id={DELETE_MODAL_ID}>
        <p style={{ padding: '1rem' }}>
          Are you sure you want to delete this print history?
        </p>
        <TitleBar title="Delete History">
          <button variant="primary" tone="critical" onClick={deleteHistory}>
            Delete
          </button>
          <button onClick={() => shopify.modal.hide(DELETE_MODAL_ID)}>
            Cancel
          </button>
        </TitleBar>
      </Modal>

      <Modal id={VIEW_MODAL_ID} variant="large">
        <div style={{ padding: '1rem' }}>
          {loadingDetails ? (
            <s-box padding="base" alignContent="center">
              <s-spinner />
            </s-box>
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 18px",
                    background: "#f6f6f7",
                    borderBottom: "1px solid #dfe3e8",
                  }}
                >
                  <s-text fontWeight="semibold">
                    {historyDetails.items.length} selected
                  </s-text>
                  <s-button
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
                      shopify.modal.hide(VIEW_MODAL_ID);
                    }}
                  >
                    Generate Barcode
                  </s-button>
                </div>

                {historyDetails.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 2fr 2fr 1.5fr 130px",
                      alignItems: "center",
                      padding: "12px 18px",
                      borderBottom:
                        index !== historyDetails.items.length - 1 ? "1px solid #ececec" : "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(index)}
                      onChange={() => {
                        if (selectedItems.includes(index)) {
                          setSelectedItems(selectedItems.filter(i => i !== index));
                        } else {
                          setSelectedItems([...selectedItems, index]);
                        }
                      }}
                    />
                    <div>
                      <s-text fontWeight="semibold">{item.product_title}</s-text>
                    </div>
                    <div>
                      <s-text tone="subdued">{item.sku}</s-text>
                    </div>
                    <div>
                      <s-badge tone="info">{item.barcode}</s-badge>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <s-button
                        variant="tertiary"
                        accessibilityLabel={`Decrease quantity for ${item.product_title}`}
                        onClick={() => {
                          setPrintQuantities((prev) => ({
                            ...prev,
                            [index]: Math.max(1, (prev[index] || 1) - 1),
                          }));
                        }}
                      >
                        −
                      </s-button>

                      <s-badge tone="success">
                        {printQuantities[index] || 1}
                      </s-badge>

                      <s-button
                        variant="tertiary"
                        accessibilityLabel={`Increase quantity for ${item.product_title}`}
                        onClick={() => {
                          setPrintQuantities((prev) => ({
                            ...prev,
                            [index]: (prev[index] || 1) + 1,
                          }));
                        }}
                      >
                        +
                      </s-button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
        <TitleBar title={`Print Job #${historyDetails?.id || ""}`}>
          <button variant="primary" onClick={handlePrintHistory}>
            Print
          </button>
        </TitleBar>
      </Modal>
    </>
  );
}