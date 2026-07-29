import React, { useState, useEffect } from 'react';
import { Page, Card, IndexTable, Text, Badge, Spinner, Box, Button, EmptyState, Banner, Frame } from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal.jsx';
import { EditIcon, DeleteIcon } from "@shopify/polaris-icons";
import { useNavigate } from "react-router-dom";
import { Pagination } from "@shopify/polaris";


export default function TemplateList() {
    const appBridge = useAppBridge();
    const fetch = appBridge.fetch || window.fetch;

    const [templates, setTemplates] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal Registry State Pointers
    const [activeModal, setActiveModal] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [deleteAllModal, setDeleteAllModal] = useState(false);
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

    const openDeleteConfirmation = (id) => {
        setTemplateToDelete(id);
        setActiveModal(true);
    };

    const closeDeleteModal = () => {
        setTemplateToDelete(null);
        setActiveModal(false);
    };
    const openDeleteAllConfirmation = () => {
        setDeleteAllModal(true);
    };

    const closeDeleteAllConfirmation = () => {
        setDeleteAllModal(false);
    };
    const handleDeleteExecute = async () => {
        if (!templateToDelete) return;

        try {
            setDeleteLoading(true);
            setError("");

            const response = await fetch(`/api/templates/${templateToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete));
                closeDeleteModal();
                shopify.toast.show("Template removed successfully");
            } else {
                throw new Error(result.message || "Failed to complete deletion task.");
            }
        } catch (err) {
            setError(err.message || "An exception occurred during deletion processing.");
            closeDeleteModal();
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        try {
            setDeleteLoading(true);

            const response = await fetch("/api/templates/delete-all", {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setTemplates([]);
                closeDeleteAllConfirmation();
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    const resourceName = { singular: 'template', plural: 'templates' };

    //pagination
    const totalPages = Math.ceil(templates.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const currentTemplates = templates.slice(
        startIndex,
        endIndex
    );
    const rowMarkup = currentTemplates.map(
        ({ id, template_name, paper_brand, paper_model, created_at }, index) => (
            <IndexTable.Row id={String(id)} key={id} position={index}>
                <IndexTable.Cell>
                    <Text fontWeight="bold" as="span">{template_name}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Badge tone="info">{paper_brand || 'Custom Brand'}</Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" tone="subdued">{paper_model || 'Generic Layout'}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    {new Date(created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Box display="flex" gap="200">
                        <Box display="flex" gap="200">
                            <Button
                                icon={EditIcon}
                                variant="tertiary"
                                accessibilityLabel="Edit Template"
                                url={`/templates/edit/${id}`}
                            />

                            <Button
                                icon={DeleteIcon}
                                variant="tertiary"
                                tone="critical"
                                accessibilityLabel="Delete Template"
                                onClick={() => openDeleteConfirmation(id)}
                            />
                        </Box>
                    </Box>
                </IndexTable.Cell>
            </IndexTable.Row>
        )
    );

    if (loading) {
        return (
            <Box padding="1200" align="center">
                <Spinner accessibilityLabel="Syncing template profiles" size="large" />
            </Box>
        );
    }

    return (
        <Frame>
            {/*MOUNT THE SEPARATED CUSTOM COMPONENTS BLOCK CLEANLY HERE */}
            <DeleteConfirmationModal
                open={activeModal}
                loading={deleteLoading}
                title="Delete template configuration?"
                message="Are you sure you want to delete this template configuration? This structural setup cannot be restored or re-mapped back once deleted."
                onConfirm={handleDeleteExecute}
                onClose={closeDeleteModal}
            />
            <DeleteConfirmationModal
                open={deleteAllModal}
                loading={deleteLoading}
                title="Delete All Templates?"
                message="This action will permanently delete ALL templates. This cannot be undone."
                onConfirm={handleDeleteAll}
                onClose={closeDeleteAllConfirmation}
            />

            <Page
                title="Label Templates"
                subtitle="Manage and edit your customized sticker layout dimensions."
                primaryAction={{
                    content: 'Create Template',
                    url: '/TamplateCreate',
                }}
                secondaryActions={[
                    {
                        content: "Delete All Templates",
                        destructive: true,
                        onAction: openDeleteAllConfirmation,
                    },
                ]}
            >
                {error && (
                    <Box paddingBlockEnd="400">
                        <Banner tone="critical" onDismiss={() => setError("")}><p>{error}</p></Banner>
                    </Box>
                )}

                {templates.length === 0 ? (
                    <Card padding="1200">
                        <EmptyState
                            heading="Design your first barcode template layout"
                            action={{ content: 'Create Template', url: '/TamplateCreate' }}
                            image="https://shopify.com"
                        >
                            <p>Configure paper sizes, padding parameters, and item data positions to align accurately with your hardware label rolls.</p>
                        </EmptyState>
                    </Card>
                ) : (
                    <Card padding="0">
                        <IndexTable
                            resourceName={resourceName}
                            itemCount={currentTemplates.length}
                            selectable={false}
                            headings={[
                                { title: 'Template Name' },
                                { title: 'Paper Brand' },
                                { title: 'Paper Model' },
                                { title: 'Created Date' },
                                { title: 'Actions' },
                            ]}
                        >
                            {rowMarkup}
                        </IndexTable>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                marginTop: "20px",
                                marginBottom: "20px",
                                width: "100%",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                }}
                            >
                                {/* <Text as="p">
      Page {currentPage} of {totalPages}
    </Text> */}

                                <Pagination
                                    hasPrevious={currentPage > 1}
                                    hasNext={currentPage < totalPages}
                                    onPrevious={() => setCurrentPage((prev) => prev - 1)}
                                    onNext={() => setCurrentPage((prev) => prev + 1)}
                                />
                            </div>
                        </div>
                    </Card>
                )}

            </Page>
        </Frame>
    );
}
