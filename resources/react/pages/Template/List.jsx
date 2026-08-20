import React, { useState, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal.jsx';
import { useNavigate } from "react-router-dom";

export default function TemplateList() {
    // Single source of the `shopify` global object.
    const shopify = useAppBridge();

    const [templates, setTemplates] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [searchDate, setSearchDate] = useState("");

    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteSelectedModal, setDeleteSelectedModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const navigate = useNavigate();

    const loadTemplates = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await fetch('/api/templates');

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setTemplates(result.data || []);
                } else {
                    throw new Error(result.message || "Failed to load data.");
                }
            } else {
                throw new Error("Server returned an active error response channel.");
            }
        } catch (err) {
            setError(err.message || "Could not retrieve templates from database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const openDeleteSelectedConfirmation = () => {
        if (selectedIds.length === 0) return;
        setDeleteSelectedModal(true);
    };

    const closeDeleteSelectedConfirmation = () => {
        setDeleteSelectedModal(false);
    };

    const handleDeleteSelected = async () => {
        try {
            setDeleteLoading(true);
            await Promise.all(
                selectedIds.map((id) =>
                    fetch(`/api/templates/${id}`, {
                        method: 'DELETE',
                        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                    })
                )
            );
            setTemplates((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
            setSelectedIds([]);
            closeDeleteSelectedConfirmation();
            shopify.toast.show("Selected templates deleted");
        } catch (err) {
            setError("Failed to delete selected templates.");
        } finally {
            setDeleteLoading(false);
        }
    };
    const filteredTemplates = templates.filter((template) => {
        const search = searchValue.toLowerCase();

        const matchesSearch =
            (template.template_name || "").toLowerCase().includes(search) ||
            (template.paper_brand || "").toLowerCase().includes(search) ||
            (template.paper_model || "").toLowerCase().includes(search);

        const matchesDate =
            !searchDate ||
            new Date(template.created_at).toISOString().slice(0, 10) === searchDate;

        return matchesSearch && matchesDate;
    });

    // pagination
    const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTemplates = filteredTemplates.slice(startIndex, endIndex);

    const toggleSelectOne = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const currentIds = currentTemplates.map((t) => t.id);
        const allSelected =
            currentIds.length > 0 && currentIds.every((id) => selectedIds.includes(id));
        setSelectedIds((prev) =>
            allSelected
                ? prev.filter((id) => !currentIds.includes(id))
                : [...new Set([...prev, ...currentIds])],
        );
    };

    if (loading) {
        return (
            <s-page heading="Label Templates">
                <s-box padding="base">
                    <s-stack
                        direction="block"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <s-spinner
                            accessibilityLabel="Loading templates"
                            size="large"
                        />
                    </s-stack>
                </s-box>
            </s-page>
        );
    }

    return (
        <>
            <DeleteConfirmationModal
                open={deleteSelectedModal}
                loading={deleteLoading}
                title={`Delete ${selectedIds.length} selected template${selectedIds.length !== 1 ? 's' : ''}?`}
                message="This will permanently delete the templates you've selected. This cannot be undone."
                onConfirm={handleDeleteSelected}
                onClose={closeDeleteSelectedConfirmation}
            />

            <s-page heading="Barcode App" subheading="Manage and edit your customized sticker layout dimensions.">
                <s-stack direction="inline" gap="base" justifyContent="end">
                    {selectedIds.length > 0 && (
                        <s-button tone="critical" onClick={openDeleteSelectedConfirmation}>
                            Delete Selected ({selectedIds.length})
                        </s-button>
                    )}

                    <s-button variant="primary" href="/TamplateCreate">
                        Create Template
                    </s-button>
                </s-stack>
                <s-box paddingBlockStart="base"></s-box>

                <s-section>
                    <s-grid gridTemplateColumns="3fr 1fr" gap="base">
                        <s-search-field
                            label="Search Templates"
                            labelAccessibilityVisibility="exclusive"
                            placeholder="Search Template Name, Brand or Model..."
                            value={searchValue}
                            onInput={(event) =>
                                setSearchValue(event.currentTarget.value)
                            }
                        />
                        <s-date-field
                            label="Created Date"
                            labelAccessibilityVisibility="exclusive"
                            value={searchDate}
                            defaultView={searchDate || undefined}
                            onChange={(event) => setSearchDate(event.currentTarget.value)}
                        ></s-date-field>
                    </s-grid>
                </s-section>

                {error && (
                    <s-section>
                        <s-banner tone="critical" onDismiss={() => setError("")}>
                            {error}
                        </s-banner>
                    </s-section>
                )}

                {filteredTemplates.length === 0 ? (
                    <s-page heading="Label Templates">
                        <s-section>
                            <s-box
                                padding="base"
                                background="subdued"
                                border="base"
                                borderRadius="base"
                            >
                                <s-stack direction="block" gap="base" alignItems="center">
                                    {/* Empty logo icon */}
                                    <div style={{ transform: "scale(1.8)" }}>
                                        <s-icon
                                            type="info"
                                            tone="auto"
                                            color="base"
                                            size="base"
                                        ></s-icon>
                                    </div>
                                    <s-heading>
                                        Design your first barcode template layout
                                    </s-heading>
                                    <s-paragraph>
                                        Configure paper sizes, padding parameters, and item data
                                        positions to align accurately with your hardware label rolls.
                                    </s-paragraph>

                                    <s-button variant="primary" href="/TamplateCreate">
                                        Create template
                                    </s-button>
                                </s-stack>
                            </s-box>
                        </s-section>
                    </s-page>
                ) : (
                    <s-section padding="none">
                        <s-table
                            paginate
                            hasPreviousPage={currentPage > 1 || undefined}
                            hasNextPage={currentPage < totalPages || undefined}
                            onPreviousPage={() => setCurrentPage((prev) => prev - 1)}
                            onNextPage={() => setCurrentPage((prev) => prev + 1)}
                        >
                            <s-table-header-row>
                                <s-table-header>
                                    <s-checkbox
                                        label="Select all"
                                        labelAccessibilityVisibility="exclusive"
                                        checked={
                                            currentTemplates.length > 0 && currentTemplates.every((t) => selectedIds.includes(t.id))
                                                ? true
                                                : undefined
                                        }
                                        onChange={toggleSelectAll}
                                    />
                                </s-table-header>
                                <s-table-header>Template Name</s-table-header>
                                <s-table-header>Paper Brand</s-table-header>
                                <s-table-header>Paper Model</s-table-header>
                                <s-table-header>Created Date</s-table-header>
                                <s-table-header>Actions</s-table-header>
                            </s-table-header-row>
                            <s-table-body>
                                {currentTemplates.map(({ id, template_name, paper_brand, paper_model, created_at }) => (
                                    <s-table-row key={id}>
                                        <s-table-cell>
                                            <s-checkbox
                                                label={`Select ${template_name}`}
                                                labelAccessibilityVisibility="exclusive"
                                                checked={selectedIds.includes(id) || undefined}
                                                onChange={() => toggleSelectOne(id)}
                                            />
                                        </s-table-cell>
                                        <s-table-cell>
                                            <s-text fontWeight="bold">{template_name}</s-text>
                                        </s-table-cell>
                                        <s-table-cell>
                                            <s-badge tone="info">{paper_brand || 'Custom Brand'}</s-badge>
                                        </s-table-cell>
                                        <s-table-cell>
                                            <s-text tone="subdued">{paper_model || 'Generic Layout'}</s-text>
                                        </s-table-cell>
                                        <s-table-cell>
                                            {new Date(created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </s-table-cell>
                                        <s-table-cell>
                                            <s-stack direction="inline" gap="tight">
                                                <s-button
                                                    icon="edit"
                                                    variant="tertiary"
                                                    accessibilityLabel="Edit Template"
                                                    href={`/templates/edit/${id}`}
                                                />

                                            </s-stack>
                                        </s-table-cell>
                                    </s-table-row>
                                ))}
                            </s-table-body>
                        </s-table>
                    </s-section>
                )}
            </s-page>
        </>
    );
}