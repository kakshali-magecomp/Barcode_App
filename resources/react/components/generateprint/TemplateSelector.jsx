import React from "react";
import {
  Card,
  Box,
  Select,
  Text,
  BlockStack,
  InlineStack,
  Badge,
} from "@shopify/polaris";

export default function TemplateSelector({
  templates,
  template,
  setTemplate,
}) {
  const selectedTemplate = templates.find(
    (t) => String(t.id) === String(template)
  );

  return (
    <Card>
      <Box padding="500">
        <BlockStack gap="400">

          <Text variant="headingMd" as="h2">
            3. Select Template
          </Text>

          <Select
            label="Template"
            value={template}
            onChange={setTemplate}
            options={[
              {
                label: "Select Template",
                value: "",
              },
              ...templates.map((item) => ({
                label: item.name,
                value: String(item.id),
              })),
            ]}
          />

          {selectedTemplate && (
            <Box
              background="bg-surface-secondary"
              padding="400"
              borderRadius="300"
            >
              <BlockStack gap="300">

                <InlineStack align="space-between">
                  <Text>Template Type</Text>

                  <Badge tone="success">
                    {selectedTemplate.template_type}
                  </Badge>
                </InlineStack>

                <InlineStack align="space-between">
                  <Text>Paper Size</Text>

                  <Text>
                    {selectedTemplate.paper_size || "-"}
                  </Text>
                </InlineStack>

                <InlineStack align="space-between">
                  <Text>Label Size</Text>

                  <Text>
                    {selectedTemplate.label_width}
                    mm ×{" "}
                    {selectedTemplate.label_height}
                    mm
                  </Text>
                </InlineStack>

                <InlineStack align="space-between">
                  <Text>Paper Brand</Text>

                  <Text>
                    {selectedTemplate.paper_brand ||
                      "-"}
                  </Text>
                </InlineStack>

              </BlockStack>
            </Box>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}