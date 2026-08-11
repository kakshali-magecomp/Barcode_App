import React, { useEffect, useState, useCallback, useRef } from "react";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useNavigate } from "react-router-dom";

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
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      shopify.toast.show("Please allow pop-ups to print.");
      return;
    }
    const labels = historyDetails.items
      .map((item, originalIndex) => ({
        item,
        originalIndex,
      }))
      .filter(({ originalIndex }) =>
        selectedItems.includes(originalIndex)
      )
      .map(({ item, originalIndex }) => {
        const settings = item.template_settings || {};
        let symbolValue = "";
        switch (settings.symbol_field_source) {
          case "sku_value":
            symbolValue = item.sku || "";
            break;
          case "barcode_value":
            symbolValue = item.barcode || "";
            break;
          case "product_name":
            symbolValue = item.product_title || "";
            break;
          case "product_price":
            symbolValue = item.price || "";
            break;
          case "product_online_url":
            symbolValue = item.online_url || "";
            break;
          default:
            symbolValue = item.barcode || "";
            break;
        }
        const quantity = Math.max(
          1,
          Number(
            printQuantities?.[originalIndex] ||
            item.qty ||
            1
          )
        );
        const decimals = Number(
          settings.price_decimal_number ?? 2
        );

        let originalPrice = Number(
          item.price ?? 0
        );

        // If API returns cents
        if (originalPrice > 999) {
          originalPrice = originalPrice / 100;
        }

        const vatPercentage = Number(
          settings.vat_percentage ?? 0
        );

        const priceWithVat =
          originalPrice +
          (originalPrice * vatPercentage) / 100;

        const amount = priceWithVat.toFixed(decimals);

        const currencyFormat =
          settings.currency_format ||
          "without_currency";

        let formattedPrice = amount;

        if (currencyFormat === "with_currency") {
          formattedPrice = `$${amount}`;
        }

        if (currencyFormat === "currency_code") {
          formattedPrice = `${amount} USD`;
        }

        if (settings.line2_currency_format) {
          formattedPrice =
            settings.line2_currency_format.replace(
              "{amount}",
              amount
            );
        }
        let symbolHTML = "";

        if (settings.symbol_enabled) {
          if (settings.symbol_type === "QR") {

            const qrSize = Number(
              settings.symbol_width_px || 140
            );

            const qrColor = (
              settings.symbol_color ||
              "#000000"
            ).replace("#", "");

            const qrURL =
              `https://api.qrserver.com/v1/create-qr-code/` +
              `?size=${qrSize}x${qrSize}` +
              `&color=${qrColor}` +
              `&data=${encodeURIComponent(
                String(symbolValue || "")
              )}`;

            symbolHTML = `
                        <img
                            class="qr"
                            src="${qrURL}"
                            alt="QR Code"
                        />
                    `;

          } else {

            let barcodeFormat =
              settings.barcode_format ||
              "CODE128";

            if (barcodeFormat === "UPCA") {
              barcodeFormat = "UPC";
            }

            if (barcodeFormat === "Code39") {
              barcodeFormat = "CODE39";
            }

            symbolHTML = `
                        <svg
                            class="barcode"
                            data-format="${barcodeFormat}"
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
                            data-color="${settings.symbol_color ||
              "#000000"
              }">
                        </svg>
                    `;
          }
        }

        let html = "";

        for (let i = 0; i < quantity; i++) {

          html += `
                    <div class="label">

                        ${settings.line1_sku
              ? `
                                    <div class="sku">
                                        ${item.sku || ""}
                                    </div>
                                `
              : ""
            }

                        ${settings.line2_name
              ? `
                                    <div class="title">
                                        ${item.product_title ||
              ""
              }
                                    </div>
                                `
              : ""
            }

                        ${settings.line2_price
              ? `
                                    <div class="price">
                                        ${formattedPrice}
                                    </div>
                                `
              : ""
            }

                        ${settings.line2_option1 &&
              item.option_1
              ? `
                                    <div class="option">
                                        ${item.option_1}
                                    </div>
                                `
              : ""
            }

                        ${settings.line2_option2 &&
              item.option_2
              ? `
                                    <div class="option">
                                        ${item.option_2}
                                    </div>
                                `
              : ""
            }

                        ${settings.line2_option3 &&
              item.option_3
              ? `
                                    <div class="option">
                                        ${item.option_3}
                                    </div>
                                `
              : ""
            }
                        ${symbolHTML}
                    </div>
                `;
        }
        return html;
      })
      .join("");
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>
                Print Job #${historyDetails.id || ""}
            </title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
            <style>
                @page {
                    margin: 5mm;
                }
                * {
                    box-sizing: border-box;
                }
                html,
                body {
                    margin: 0;
                    padding: 0;
                    background: #ffffff;
                    font-family: Arial, sans-serif;
                }
                body {
                    padding: 10px;
                    display: grid;
                    grid-template-columns:
                        repeat(
                            auto-fill,
                            250px
                        );
                    gap: 10px;
                    align-items: start;
                    justify-content: start;
                }
                .label {
                    width: 250px;
                    min-height: 0;
                    height: auto;
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: center;
                    page-break-inside: avoid;
                    break-inside: avoid;
                    overflow: hidden;
                }
                .sku {
                    width: 100%;
                    font-size: 12px;
                    font-weight: 500;
                    margin-bottom: 5px;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    white-space: normal;
                }
                .title {
                    width: 100%;
                    font-size: 13px;
                    font-weight: 700;
                    margin-bottom: 5px;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    white-space: normal;
                }
                .price {
                    width: 100%;
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 7px;
                    word-break: break-word;
                }
                .option {
                    width: 100%;
                    font-size: 11px;
                    margin-bottom: 3px;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                }
                .barcode {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 5px auto 0;
                }
                .qr {
                    max-width: 100%;
                    width: auto;
                    height: auto;
                    display: block;
                    margin: 5px auto 0;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .label {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            ${labels}
            <script>
                window.onload = function () {
                    const barcodes =
                        document.querySelectorAll(
                            ".barcode"
                        );
                    barcodes.forEach(function (barcode) {
                        const format =
                            barcode.dataset.format ||
                            "CODE128";

                        const value =
                            barcode.dataset.value ||
                            "";

                        const width =
                            Number(
                                barcode.dataset.width
                            ) || 2;

                        const height =
                            Number(
                                barcode.dataset.height
                            ) || 45;

                        const fontSize =
                            Number(
                                barcode.dataset.font
                            ) || 16;

                        const displayValue =
                            barcode.dataset.display !==
                            "false";

                        const color =
                            barcode.dataset.color ||
                            "#000000";

                        try {

                            JsBarcode(
                                barcode,
                                value,
                                {
                                    format: format,
                                    width: width,
                                    height: height,
                                    fontSize: fontSize,
                                    displayValue:
                                        displayValue,
                                    lineColor: color,
                                    margin: 0
                                }
                            );

                        } catch (error) {

                            console.error(
                                "Barcode generation failed:",
                                error
                            );

                        }

                    });
                    setTimeout(function () {
                        window.focus();
                        window.print();
                    }, 800);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
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
              {/* Add here */}
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