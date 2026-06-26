import React, { useEffect, useState } from "react";
import {
  Page,
  Card,
  IndexTable,
  Text,
  useIndexResourceState,
  Spinner,
  BlockStack,
  Badge,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import TemplatePreviewModal from "../../components/TemplatePreviewModal";
import DeleteConfirmationModal from "../../components/DeleteTemplateModal";

export default function TemplateList() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const result = await response.json();

      setTemplates(result.data || []);
    } catch (error) {
      console.error(error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openTemplate = (template) => {
    setSelectedTemplate(template);
    setModalOpen(true);
  };

  const resourceName = {
    singular: "template",
    plural: "templates",
  };

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
  } = useIndexResourceState(templates);

  const deleteTemplates = async () => {
    try {
      setDeleteLoading(true);

      const response = await fetch(
        "/api/templates/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            ids: selectedResources,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setTemplates((prev) =>
          prev.filter(
            (template) =>
              !selectedResources.includes(
                String(template.id)
              )
          )
        );

        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const rowMarkup = templates.map((template, index) => (
    <IndexTable.Row
      id={String(template.id)}
      key={template.id}
      selected={selectedResources.includes(String(template.id))}
      position={index}
    >
      <IndexTable.Cell>
        {template.id}
      </IndexTable.Cell>

      <IndexTable.Cell>
        <button
          onClick={() => openTemplate(template)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#005bd3",
            fontWeight: 600,
            padding: 0,
            textAlign: "left",
          }}
        >
          {template.name}
        </button>
      </IndexTable.Cell>

      <IndexTable.Cell>
        {template.description || "-"}
      </IndexTable.Cell>

      <IndexTable.Cell>
        {template.note || "-"}
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Badge>
          {template.template_type || "Barcode"}
        </Badge>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <>
      <Page
        title="Manage Templates"
        primaryAction={{
          content: "Create Template",
          onAction: () => navigate("/CreateTemplate"),
        }}
        secondaryActions={[
          {
            content: `Delete Selected (${selectedResources.length})`,
            destructive: true,
            disabled: selectedResources.length === 0,
            onAction: () => setDeleteModalOpen(true),
          },
        ]}
      >
        <BlockStack gap="400">
          <Card>
            {loading ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                }}
              >
                <Spinner size="large" />
              </div>
            ) : (
              <IndexTable
                resourceName={resourceName}
                itemCount={templates.length}
                selectedItemsCount={
                  allResourcesSelected
                    ? "All"
                    : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: "ID" },
                  { title: "Template Name" },
                  { title: "Description" },
                  { title: "Note" },
                  { title: "Type" },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Card>
        </BlockStack>
      </Page>

      <TemplatePreviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        template={selectedTemplate}
      />
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={deleteTemplates}
        loading={deleteLoading}
        count={selectedResources.length}
      />
    </>
  );
}