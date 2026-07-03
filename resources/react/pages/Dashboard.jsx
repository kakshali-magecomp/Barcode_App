import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, Text, Button, BlockStack, InlineGrid, Box, Icon, List, Badge, Spinner } from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { PrintIcon,PageAddIcon,SettingsIcon,IconsIcon } from '@shopify/polaris-icons';

export default function Dashboard() {
    const appBridge = useAppBridge();
    const fetch = appBridge.fetch || window.fetch;

    const [stats, setStats] = useState({ templates_count: 0, products_count: 0 });
    const [loading, setLoading] = useState(true);

    // Load baseline dashboard counters out of our backend on mount
    useEffect(() => {
        async function loadDashboardStats() {
            try {
                const res = await fetch('/api/dashboard-stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Could not load dashboard statistics matrix.");
            } finally {
                setLoading(false);
            }
        }
        loadDashboardStats();
    }, [fetch]);

    if (loading) {
        return (
            <Box padding="1200" align="center">
                <Spinner accessibilityLabel="Loading Dashboard Parameters" size="large" />
            </Box>
        );
    }

    return (
        <Page title="Dashboard" subtitle="Welcome to your Barcode Labels & SKU Automation hub.">
            <Layout>
                
                {/* TOP ROW: Core Metrics Highlights Grid */}
                <Layout.Section>
                    <InlineGrid columns={3} gap="400">
                        <Card roundedTop={true}>
                            <BlockStack gap="100">
                                <Text as="h3" variant="headingSm" tone="subdued">Custom Layout Templates</Text>
                                <Text as="p" variant="headingXl">{stats.templates_count}</Text>
                                <Box marginTop="200">
                                    <Badge tone="success">Active Layouts</Badge>
                                </Box>
                            </BlockStack>
                        </Card>
                        
                        <Card>
                            <BlockStack gap="100">
                                <Text as="h3" variant="headingSm" tone="subdued">Total Sync Products</Text>
                                <Text as="p" variant="headingXl">{stats.products_count}</Text>
                                <Box marginTop="200">
                                    <Badge tone="info">Live Catalog Feed</Badge>
                                </Box>
                            </BlockStack>
                        </Card>

                        <Card>
                            <BlockStack gap="100">
                                <Text as="h3" variant="headingSm" tone="subdued">App Plan Tier</Text>
                                <Text as="p" variant="headingLg">Free Tier Mode</Text>
                                <Box marginTop="200">
                                    <Badge tone="attention">Basic Standard</Badge>
                                </Box>
                            </BlockStack>
                        </Card>
                    </InlineGrid>
                </Layout.Section>

                {/* LOWER ROW - LEFT SIDE: Fast Action Launchpads */}
                <Layout.Section variant="oneThird">
                    <BlockStack gap="400">
                        <Card>
                            <BlockStack gap="300">
                                <Text as="h3" variant="headingMd" fontWeight="semibold">Quick Actions</Text>
                                <Button fullWidth variant="primary" icon={PrintIcon} url="/products">
                                    Generate & Print Labels
                                </Button>
                                <Button fullWidth icon={PageAddIcon} url="/TamplateCreate">
                                    Create Custom Template
                                </Button>
                                <Button fullWidth icon={SettingsIcon} url="/Settingindex">
                                    Adjust App Settings
                                </Button>
                            </BlockStack>
                        </Card>
                    </BlockStack>
                </Layout.Section>

                {/* LOWER ROW - RIGHT SIDE: Setup Instructions Onboarding Checklist */}
                <Layout.Section>
                    <Card>
                        <BlockStack gap="300">
                            <Text as="h3" variant="headingMd" fontWeight="semibold">Application Getting Started Guide</Text>
                            <Text as="p" tone="subdued">Follow these steps to configure high-resolution printing automation profiles across your warehouse:</Text>
                            <Box paddingInlineStart="200">
                                <List type="number">
                                    <List.Item>
                                        Go to the <strong>SKU Generation</strong> sub-panel settings page to set up automated numbering schemas sequences for incoming variants.
                                    </List.Item>
                                    <List.Item>
                                        Build custom print sizes layout parameters blueprints matching your sticky labels rolls inside the <strong>Templates Manager</strong>.
                                    </List.Item>
                                    <List.Item>
                                        Head over to the <strong>Products Catalog Grid</strong>, select your target lines via checkboxes, and initiate batch printing operations directly.
                                    </List.Item>
                                </List>
                            </Box>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
