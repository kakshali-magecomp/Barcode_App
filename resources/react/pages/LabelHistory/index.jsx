import React, { useEffect, useState, useCallback, useRef } from "react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useNavigate } from "react-router-dom";
import { openPrintWindow } from '../../components/Printlayout';
import TemplateLabelRenderer from "../../components/TemplateLabelRenderer";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";

export default function LabelHistory() {
  const shopify = useAppBridge();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState("");

  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [historyDetails, setHistoryDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);

  const [selectedItems, setSelectedItems] = useState([]);
  const [printQuantities, setPrintQuantities] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [printSettings, setPrintSettings] = useState(null);

  const historyPrintRef = useRef(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFilter]);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/print-history");
      const json = await res.json();
      if (json.success) {
        setHistories(json.data || []);
        setFilteredHistory(json.data || []);
      } else {
        setError(json.message || "Unable to load history.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load print history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    async function loadStoreCurrency() {
      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        setCurrencyCode(json.currency_code || 'USD');
      } catch (err) {
        console.log(err);
      }
    }
    loadStoreCurrency();
  }, []);

  useEffect(() => {
    async function loadPrintSettings() {
      try {
        const res = await fetch("/api/print-settings");
        const json = await res.json();
        if (json.success) {
          setPrintSettings(json.settings);
        }
      } catch (err) {
        console.log(err);
      }
    }
    loadPrintSettings();
  }, []);

  useEffect(() => {
    let result = histories;

    if (search.trim()) {
      const searchText = search.toLowerCase().trim();
      result = result.filter((item) => {
        const formattedDate = new Date(item.created_at || item.printed_at)
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
        const itemDate = new Date(item.created_at || item.printed_at).toISOString().slice(0, 10);
        return itemDate === dateFilter;
      });
    }

    setFilteredHistory(result);
  }, [search, dateFilter, histories]);

  const openHistoryDetails = async (id) => {
    try {
      setSelectedHistoryId(id);
      setLoadingDetails(true);
      setViewModalOpen(true);
      const res = await fetch(`/api/print-history/${id}`);
      const json = await res.json();
      if (!json.success) {
        shopify.toast.show(json.message || "Failed to load details.");
        setViewModalOpen(false);
        return;
      }
      const history = json.data;
      setHistoryDetails(history);
      const quantities = {};

      (history.items || []).forEach((item, index) => {
        quantities[index] = Math.max(1, Number(item.qty) || 1);
      });

      setPrintQuantities(quantities);
      setSelectedItems((history.items || []).map((_, index) => index));
    } catch (err) {
      console.error("Failed to load history:", err);
      shopify.toast.show("Error loading job details.");
      setViewModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const triggerDeleteSingle = (id) => {
    setItemsToDelete([id]);
    setDeleteModalOpen(true);
  };

  const triggerDeleteBulk = () => {
    if (selectedRows.length === 0) return;
    setItemsToDelete(selectedRows);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await Promise.all(
        itemsToDelete.map((id) =>
          fetch(`/api/print-history/${id}`, {
            method: "DELETE",
          })
        )
      );

      shopify.toast.show(
        `${itemsToDelete.length} print history record${itemsToDelete.length !== 1 ? 's' : ''} deleted.`
      );
      setSelectedRows([]);
      setDeleteModalOpen(false);
      setItemsToDelete([]);
      loadHistory();
    } catch (err) {
      setError("Failed to delete history items.");
      setDeleteModalOpen(false);
    }
  };

  const handlePrintHistory = () => {
    if (!historyDetails) return;

    if (!selectedItems.length) {
      shopify.toast.show("Please select at least one product to print.");
      return;
    }

    const firstSelectedIndex = selectedItems[0];
    const firstSelectedItem = historyDetails.items[firstSelectedIndex];
    const paper = firstSelectedItem?.template_settings?.layout_settings;

    if (!paper) {
      shopify.toast.show("Paper template information is missing.");
      return;
    }

    const rows = Number(paper.rows || 1);
    const columns = Number(paper.columns || 1);
    const labelsPerSheet = rows * columns;

    const labels = selectedItems
      .map((index) => {
        const item = historyDetails.items[index];
        const printLabel = document.getElementById(`history-print-label-${index}`);

        if (!printLabel) {
          console.warn(`Print label not found for history item ${index}`);
          return "";
        }

        const quantity = Math.max(
          1,
          Number(printQuantities[index]) || Number(item.qty) || 1
        );

        const labelHtml = printLabel.innerHTML;

        return Array.from({ length: quantity }, () => `
        <div class="label">
          <div class="label-content">
            ${labelHtml}
          </div>
        </div>
      `).join("");
      })
      .join("");

    if (!labels.trim()) {
      shopify.toast.show("No labels available to print.");
      return;
    }

    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = labels;

    const allLabels = Array.from(tempContainer.querySelectorAll(".label"));
    const sheets = [];

    for (let start = 0; start < allLabels.length; start += labelsPerSheet) {
      const sheetLabels = allLabels
        .slice(start, start + labelsPerSheet)
        .map((label) => label.outerHTML)
        .join("");

      sheets.push(`
      <div class="print-sheet">
        ${sheetLabels}
      </div>
    `);
    }

    const bodyHtml = sheets.join("");

    openPrintWindow({
      bodyHtml,
      paperTemplate: paper,
      useJsBarcodeScript: true,
      onAfterPrint: () => { },
    });
  };

  const handlePrintAllReport = () => {
    const win = window.open("", "_blank");
    const rows = filteredHistory.map((item) => `
<tr>
  <td style="padding: 8px 12px; border: 1px solid #e1e3e5; font-weight: bold;">#${item.id}</td>
  <td style="padding: 8px 12px; border: 1px solid #e1e3e5;">${item.template?.template_name || "Standard Label"}</td>
  <td style="padding: 8px 12px; border: 1px solid #e1e3e5; text-align: center; font-weight: bold;">${item.print_qty}</td>
  <td style="padding: 8px 12px; border: 1px solid #e1e3e5; font-family: monospace;">${item.client_ip || "Local"}</td>
  <td style="padding: 8px 12px; border: 1px solid #e1e3e5;">${new Date(item.created_at || item.printed_at).toLocaleString()}</td>
</tr>
`).join("");

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Barcode Print History Log Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #202223; }
    h2 { color: #01161d; margin-bottom: 4px; }
    p { color: #6d7175; font-size: 14px; margin-top: 0; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th { background: #f4f6f8; border: 1px solid #e1e3e5; padding: 10px 12px; text-align: left; font-weight: 600; }
  </style>
</head>
<body>
  <h2>Barcode Print History Logs</h2>
  <p>Generated on ${new Date().toLocaleString()} • ${filteredHistory.length} Total Print Jobs</p>
  <table>
    <thead>
      <tr>
        <th>Job ID</th>
        <th>Template Name</th>
        <th style="text-align: center;">Total Labels</th>
        <th>Client IP</th>
        <th>Printed Date & Time</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }</script>
</body>
</html>
`);
    win.document.close();
  };

  const summary = {
    totalPrints: histories.length,
    totalLabels: histories.reduce((total, item) => total + Number(item.print_qty || 0), 0),
    todayPrints: histories.filter((item) => {
      const today = new Date().toDateString();
      return new Date(item.created_at || item.printed_at).toDateString() === today;
    }).length,
    lastPrint:
      histories.length > 0
        ? new Date(histories[0].created_at || histories[0].printed_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        : "-",
  };

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  const allPageRowsSelected =
    paginatedHistory.length > 0 &&
    paginatedHistory.every((item) => selectedRows.includes(item.id));

  const toggleSelectAllPageRows = () => {
    if (allPageRowsSelected) {
      setSelectedRows((prev) => prev.filter((id) => !paginatedHistory.some((item) => item.id === id)));
    } else {
      const pageIds = paginatedHistory.map((item) => item.id);
      setSelectedRows((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  if (loading) {
    return (
      <s-page heading="Print History">
        <TitleBar title="barcodedemo-app" />
        <s-section>
          <s-box padding="loose" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <s-spinner accessibilityLabel="Loading print history" size="large" />
            <s-text tone="subdued" style={{ marginTop: '12px' }}>Loading print history records...</s-text>
          </s-box>
        </s-section>
      </s-page>
    );
  }

  return (
    <>
      <TitleBar title="barcodedemo-app" />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        title={`Delete ${itemsToDelete.length} history record${itemsToDelete.length !== 1 ? 's' : ''}?`}
        message={`Are you sure you want to delete ${itemsToDelete.length === 1 ? 'this print log' : `these ${itemsToDelete.length} print logs`}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemsToDelete([]);
        }}
      />

      <s-page heading="Print History" subheading="View, reprint, or export audit logs of all printed barcode sticker jobs.">
        {/* Banner Section */}
        <s-section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(90deg, #01161d 0%, #008ba8 100%)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ width: '22px', height: '22px', color: '#008ba8' }}>
                  <s-icon type="clock" tone="inherit" size="base" />
                </div>
              </div>
              <div>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>
                  Label Printing History
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '2px' }}>
                  Audit log of all physical sticker labels printed for your store catalog
                </div>
              </div>
            </div>

            <s-stack direction="inline" gap="base">
              <s-button variant="primary" icon="print" onClick={handlePrintAllReport}>
                Print Log Report
              </s-button>
            </s-stack>
          </div>
        </s-section>

        {error && (
          <s-section>
            <s-banner tone="critical" onDismiss={() => setError("")}>
              {error}
            </s-banner>
          </s-section>
        )}

        {/* Executive Metrics Overview Cards */}
        <s-section>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px',
            }}
          >
            <div style={metricCardStyle}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6d7175' }}>TOTAL PRINT JOBS</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#01161d', marginTop: '4px' }}>
                {summary.totalPrints}
              </div>
              <div style={{ fontSize: '11px', color: '#8c9196', marginTop: '2px' }}>Lifetime print logs</div>
            </div>

            <div style={{ ...metricCardStyle, borderColor: '#008ba8', background: '#f0f9fa' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#008ba8' }}>TOTAL STICKERS PRINTED</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#008ba8', marginTop: '4px' }}>
                {summary.totalLabels}
              </div>
              <div style={{ fontSize: '11px', color: '#008ba8', marginTop: '2px' }}>Individual barcode stickers</div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6d7175' }}>TODAY'S PRINTS</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#01161d', marginTop: '4px' }}>
                {summary.todayPrints}
              </div>
              <div style={{ fontSize: '11px', color: '#8c9196', marginTop: '2px' }}>Jobs created today</div>
            </div>

            <div style={metricCardStyle}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6d7175' }}>LAST PRINTED</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#01161d', marginTop: '8px' }}>
                {summary.lastPrint}
              </div>
              <div style={{ fontSize: '11px', color: '#8c9196', marginTop: '2px' }}>Most recent activity</div>
            </div>
          </div>
        </s-section>

        {/* Search, Filter & History Log Table */}
        <s-section>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              overflow: 'hidden',
            }}
          >
            {/* Search & Action Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '14px 16px',
                borderBottom: '1px solid #e2e8f0',
                background: '#ffffff',
              }}
            >
              <div style={{ flex: '1', minWidth: '240px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: '1', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search by Job ID, Template Name or IP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#f8fafc',
                      color: '#0f172a',
                    }}
                  />
                </div>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#f8fafc',
                    color: '#334155',
                  }}
                />
                {(search || dateFilter) && (
                  <s-button
                    variant="tertiary"
                    onClick={() => {
                      setSearch("");
                      setDateFilter("");
                    }}
                  >
                    Clear
                  </s-button>
                )}
              </div>

              {selectedRows.length > 0 && (
                <s-button tone="critical" onClick={triggerDeleteBulk}>
                  Delete Selected ({selectedRows.length})
                </s-button>
              )}
            </div>

            {/* Data Table Area */}
            {filteredHistory.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px 20px',
                  background: '#ffffff',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>
                  No print history records found
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  {search || dateFilter
                    ? "No records match your active search filter."
                    : "No barcode label sticker jobs have been printed yet."}
                </div>
                {(search || dateFilter) && (
                  <s-button
                    onClick={() => {
                      setSearch("");
                      setDateFilter("");
                    }}
                  >
                    Reset Search Filters
                  </s-button>
                )}
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ ...thStyle, width: '42px', paddingLeft: '16px' }}>
                          <s-checkbox
                            label="Select all"
                            labelAccessibilityVisibility="exclusive"
                            checked={allPageRowsSelected || undefined}
                            onChange={toggleSelectAllPageRows}
                          />
                        </th>
                        <th style={{ ...thStyle, width: '100px' }}>Print ID</th>
                        <th style={{ ...thStyle, width: '28%' }}>Template Name</th>
                        <th style={{ ...thStyle, width: '130px', textAlign: 'center' }}>Total Labels</th>
                        <th style={{ ...thStyle, width: '130px' }}>Client IP</th>
                        <th style={{ ...thStyle, width: '22%' }}>Printed Date</th>
                        <th style={{ ...thStyle, width: '130px', textAlign: 'right', paddingRight: '16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.map((item) => {
                        const isChecked = selectedRows.includes(item.id);
                        const printedDate = new Date(item.created_at || item.printed_at);
                        const formattedDateStr = printedDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr
                            key={item.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: isChecked ? '#f0f9ff' : '#ffffff',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <td style={{ ...tdStyle, paddingLeft: '16px' }}>
                              <s-checkbox
                                label={`Select ${item.id}`}
                                labelAccessibilityVisibility="exclusive"
                                checked={isChecked || undefined}
                                onChange={() => {
                                  setSelectedRows((prev) =>
                                    prev.includes(item.id)
                                      ? prev.filter((id) => id !== item.id)
                                      : [...prev, item.id]
                                  );
                                }}
                              />
                            </td>
                            <td style={tdStyle}>
                              <span
                                onClick={() => openHistoryDetails(item.id)}
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: '#0284c7',
                                  cursor: 'pointer',
                                  background: '#e0f2fe',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                }}
                              >
                                #{item.id}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.template?.template_name || "Standard Label Template"}
                              </div>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  padding: '3px 9px',
                                  borderRadius: '12px',
                                }}
                              >
                                {item.print_qty} stickers
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>
                                {item.client_ip || "127.0.0.1"}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <div style={{ fontSize: '13px', color: '#334155' }}>{formattedDateStr}</div>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right', paddingRight: '16px' }}>
                              <div style={{ display: 'inline-flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <s-button
                                  icon="view"
                                  variant="tertiary"
                                  onClick={() => openHistoryDetails(item.id)}
                                />
                                <s-button
                                  icon="delete"
                                  variant="tertiary"
                                  tone="critical"
                                  onClick={() => triggerDeleteSingle(item.id)}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '12px 16px',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Showing {startIndex + 1}–{Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} print records
                  </div>

                  {totalPages > 1 && (
                    <s-stack direction="inline" gap="tight" alignItems="center">
                      <s-button
                        variant="tertiary"
                        disabled={currentPage <= 1 || undefined}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </s-button>
                      <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <s-button
                        variant="tertiary"
                        disabled={currentPage >= totalPages || undefined}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </s-button>
                    </s-stack>
                  )}
                </div>
              </>
            )}
          </div>
        </s-section>
      </s-page>

      {/* View & Re-Print Details Modal */}
      {viewModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #e1e3e5',
                background: '#f8fafc',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#01161d' }}>
                  Print Job #{selectedHistoryId} Details
                </div>
                <div style={{ fontSize: '12px', color: '#6d7175', marginTop: '2px' }}>
                  Template: <strong>{historyDetails?.template?.template_name || 'Standard Template'}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6d7175',
                  lineHeight: 1,
                  padding: '4px 8px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <s-spinner size="large" />
                  <div style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                    Loading job products...
                  </div>
                </div>
              ) : historyDetails ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Quick Re-open in Print Workspace CTA Banner */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f0f9fa',
                      border: '1px solid #c4ebf2',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#008ba8' }}>
                        Re-open this print job in workspace
                      </div>
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
                        Load all {historyDetails.items.length} products into the print label generator workspace to adjust quantities.
                      </div>
                    </div>
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
                        setViewModalOpen(false);
                      }}
                    >
                      Open in Print Workspace
                    </s-button>
                  </div>

                  {/* Items List Table */}
                  <div style={{ border: '1px solid #e1e3e5', borderRadius: '10px', overflow: 'hidden', background: '#ffffff' }}>
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f4f6f8', borderBottom: '1px solid #e1e3e5' }}>
                          <th style={{ ...thStyle, width: '38px' }}>
                            <input
                              type="checkbox"
                              checked={
                                historyDetails.items.length > 0 &&
                                historyDetails.items.every((_, idx) => selectedItems.includes(idx))
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems(historyDetails.items.map((_, idx) => idx));
                                } else {
                                  setSelectedItems([]);
                                }
                              }}
                            />
                          </th>
                          <th style={{ ...thStyle, width: '35%' }}>Product Title</th>
                          <th style={{ ...thStyle, width: '30%' }}>SKU</th>
                          <th style={{ ...thStyle, width: '20%' }}>Barcode</th>
                          <th style={{ ...thStyle, width: '110px', textAlign: 'center' }}>Print Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyDetails.items.map((item, index) => {
                          const isChecked = selectedItems.includes(index);
                          return (
                            <tr
                              key={index}
                              style={{
                                borderBottom: '1px solid #e1e3e5',
                                background: isChecked ? '#ffffff' : '#f9fafb',
                              }}
                            >
                              <td style={tdStyle}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedItems((prev) =>
                                      prev.includes(index)
                                        ? prev.filter((i) => i !== index)
                                        : [...prev, index]
                                    );
                                  }}
                                />
                              </td>
                              <td style={tdStyle}>
                                <div style={{ fontWeight: 600, color: '#202223', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.product_title}
                                </div>
                                {item.variant_title && item.variant_title !== 'Default Title' && (
                                  <div style={{ fontSize: '11px', color: '#6d7175' }}>
                                    {item.variant_title}
                                  </div>
                                )}
                              </td>
                              <td style={tdStyle}>
                                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.current_sku || item.sku || '-'}
                                </div>
                              </td>
                              <td style={tdStyle}>
                                {item.barcode ? (
                                  <s-badge tone="info">{item.barcode}</s-badge>
                                ) : (
                                  <span style={{ fontSize: '12px', color: '#8c9196' }}>-</span>
                                )}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrintQuantities((prev) => ({
                                        ...prev,
                                        [index]: Math.max(1, (prev[index] || 1) - 1),
                                      }));
                                    }}
                                    style={btnQtyStyle}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={printQuantities[index] ?? 1}
                                    onChange={(e) => {
                                      const val = e.target.value === "" ? "" : Math.max(1, Number(e.target.value));
                                      setPrintQuantities((prev) => ({ ...prev, [index]: val }));
                                    }}
                                    style={inputQtyStyle}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrintQuantities((prev) => ({
                                        ...prev,
                                        [index]: (prev[index] || 1) + 1,
                                      }));
                                    }}
                                    style={btnQtyStyle}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderTop: '1px solid #e1e3e5',
                background: '#f8fafc',
              }}
            >
              <s-button onClick={() => setViewModalOpen(false)}>
                Close
              </s-button>

              <s-button variant="primary" icon="print" onClick={handlePrintHistory}>
                Direct Print ({selectedItems.reduce((sum, idx) => sum + (Number(printQuantities[idx]) || 1), 0)} Stickers)
              </s-button>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen Print Render Containers */}
      <div
        ref={historyPrintRef}
        style={{
          position: "absolute",
          left: "-100000px",
          top: 0,
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        {historyDetails && printSettings && historyDetails.items?.map((item, index) => (
          <div
            key={`history-print-${index}`}
            id={`history-print-label-${index}`}
            className="print-template-label"
          >
            <TemplateLabelRenderer
              design={item.template_settings || {}}
              product={{
                product_title: item.product_title,
                current_sku: item.current_sku || item.sku,
                sku: item.sku,
                barcode: item.barcode,
                price: item.price,
                vendor: item.vendor,
                variant_title:
                  item.variant_title && item.variant_title.trim().toLowerCase() !== "default title"
                    ? item.variant_title
                    : "",
                option_1:
                  item.option_1 && item.option_1.trim().toLowerCase() !== "default title"
                    ? item.option_1
                    : "",
                option_2:
                  item.option_2 && item.option_2.trim().toLowerCase() !== "default title"
                    ? item.option_2
                    : "",
                option_3:
                  item.option_3 && item.option_3.trim().toLowerCase() !== "default title"
                    ? item.option_3
                    : "",
                online_url: item.online_url,
              }}
              barcodeSettings={item.template_settings || {}}
              formatPrice={(product) => {
                const settings = item.template_settings || {};
                const decimals = Number(printSettings?.price_decimal_number ?? 2);
                let originalPrice = Number(product?.price ?? 0);
                const vatPercentage = Number(printSettings?.vat_percentage ?? 0);
                const priceWithVat = originalPrice + (originalPrice * vatPercentage) / 100;
                const amount = priceWithVat.toFixed(decimals);

                let format = String(settings.line2_currency_format ?? "").trim();
                format = format
                  .replace(/\{\{amount\}\}/gi, "{amount}")
                  .replace(/\$amount/gi, "${amount}");

                if (format.includes("{amount}")) {
                  return format.replace(/\{amount\}/gi, amount);
                }

                const ENUM_TOKENS = ["without_currency", "with_currency", "currency_code"];
                const isEnumToken = ENUM_TOKENS.includes(format.toLowerCase());

                if (format && !isEnumToken) {
                  return `${format} ${amount}`;
                }

                const resolvedFormat = isEnumToken
                  ? format.toLowerCase()
                  : (printSettings?.currency_format ?? "without_currency");

                const currency = item.currency_code || currencyCode || "USD";
                const locale = currency === "INR" ? "en-IN" : "en";

                if (resolvedFormat === "currency_code") {
                  return `${amount} ${currency}`;
                }

                if (resolvedFormat === "with_currency") {
                  return new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency,
                    currencyDisplay: "symbol",
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                  }).format(priceWithVat);
                }

                return amount;
              }}
              printMode={true}
            />
          </div>
        ))}
      </div>
    </>
  );
}

const metricCardStyle = {
  background: '#ffffff',
  border: '1px solid #e1e3e5',
  borderRadius: '12px',
  padding: '16px 18px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
};

const thStyle = {
  padding: '12px 14px',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#475569',
  textAlign: 'left',
  boxSizing: 'border-box',
};

const tdStyle = {
  padding: '12px 14px',
  fontSize: '13px',
  verticalAlign: 'middle',
  boxSizing: 'border-box',
};

const btnQtyStyle = {
  width: '24px',
  height: '24px',
  border: '1px solid #c9cccf',
  background: '#ffffff',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '13px',
  lineHeight: '1',
  color: '#333',
  padding: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const inputQtyStyle = {
  width: '40px',
  height: '24px',
  border: '1px solid #8c9196',
  borderRadius: '4px',
  textAlign: 'center',
  fontSize: '12px',
  background: '#ffffff',
  color: '#202223',
  outline: 'none',
  boxSizing: 'border-box',
  padding: '0',
};