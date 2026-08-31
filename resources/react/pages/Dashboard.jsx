import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, Text, Badge, Button, BlockStack, InlineStack, Grid, Spinner, Divider, List, Box, Icon } from '@shopify/polaris';
import { CheckCircleIcon, PrintIcon, XIcon, MobileIcon } from '@shopify/polaris-icons';
import { TitleBar } from '@shopify/app-bridge-react';
import { useNavigate } from 'react-router-dom';
import Promoblock from '../components/Promoblock';

export default function Dashboard() {
    const [stats, setStats] = useState({ templates_count: 0, products_count: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadDashboardStats() {
            try {
                const res = await fetch('/api/dashboard-stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.statistics || data);
                }
            } catch (err) {
                console.error("Could not load dashboard statistics matrix.");
            } finally {
                setLoading(false);
            }
        }
        loadDashboardStats();
    }, []);

    if (loading) {
        return (
            <Page>
                <TitleBar title="barcodedemo-app" />
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Spinner accessibilityLabel="Loading dashboard" size="large" />
                </div>
            </Page>
        );
    }

    return (
        <Page 
            title="Dashboard"
            subtitle="Welcome to your Barcode Labels & SKU Automation hub."
            fullWidth
        >
            <TitleBar title="barcodedemo-app" />
            
            <BlockStack gap="400">
                <Layout>
                    <Layout.Section>
                        <div style={{
                            background: 'linear-gradient(90deg, #01161d 0%, #008ba8 100%)',
                            borderRadius: '12px',
                            padding: '20px 24px',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}>
                            {/* Abstract Background Shapes */}
                            <div style={{ position: 'absolute', right: '15%', top: '-20%', width: '300px', height: '300px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%' }}></div>
                            <div style={{ position: 'absolute', right: '-5%', bottom: '-30%', width: '200px', height: '200px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%' }}></div>
                            
                            <div style={{ zIndex: 1, flex: 1, maxWidth: '600px' }}>
                                <Text as="h2" variant="headingXl" fontWeight="bold">
                                    <span style={{ color: '#ffffff' }}>Optimize your inventory workflow with </span>
                                    <span style={{ color: '#f0e358' }}>Barcode & SKU Automation.</span>
                                </Text>
                                
                                <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                                    <BlockStack gap="100">
                                        <InlineStack gap="200" wrap={false} blockAlign="center">
                                            <div style={{ color: '#f0e358', display: 'flex', width: '20px' }}><Icon source={CheckCircleIcon} tone="inherit" /></div>
                                            <Text as="span" variant="bodyMd" tone="textInverse">Smarter barcode and SKU generation across your entire catalog.</Text>
                                        </InlineStack>
                                        <InlineStack gap="200" wrap={false} blockAlign="center">
                                            <div style={{ color: '#f0e358', display: 'flex', width: '20px' }}><Icon source={CheckCircleIcon} tone="inherit" /></div>
                                            <Text as="span" variant="bodyMd" tone="textInverse">Integrated with high-resolution custom template printing.</Text>
                                        </InlineStack>
                                    </BlockStack>
                                </div>

                                <Button 
                                    onClick={() => navigate('/Settingindex')} 
                                >
                                    Configure App Settings
                                </Button>
                            </div>

                            <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingLeft: '24px' }}>
                                <div style={{ 
                                    background: '#ffffff', 
                                    borderRadius: '16px', 
                                    padding: '16px', 
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '70px',
                                    height: '70px'
                                }}>
                                    <div style={{ width: '32px', height: '32px', color: '#008ba8' }}>
                                        <Icon source={PrintIcon} />
                                    </div>
                                </div>
                                <Text as="p" variant="headingSm" tone="textInverse" alignment="center">
                                    Barcode & SKU
                                </Text>
                            </div>
                        </div>
                    </Layout.Section>

                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingMd">Application Getting Started Guide</Text>
                                <Text as="p" tone="subdued">
                                    Follow these steps to configure your app for automated SKU generation and label printing:
                                </Text>
                                <Divider />
                                <List type="number">
                                    <List.Item>
                                        Go to the <Text as="span" fontWeight="bold">SKU Generation</Text> sub-panel settings page to set up automated numbering schema sequences for incoming variants.
                                    </List.Item>
                                    <List.Item>
                                        Build custom print size layout blueprints matching your sticky label rolls inside the <Text as="span" fontWeight="bold">Templates Manager</Text>.
                                    </List.Item>
                                    <List.Item>
                                        Head over to the <Text as="span" fontWeight="bold">Products Catalog Grid</Text>, select your target lines via checkboxes, and initiate batch printing operations directly.
                                    </List.Item>
                                </List>
                            </BlockStack>
                        </Card>
                    </Layout.Section>

                    <Layout.Section variant="oneThird">
                        <BlockStack gap="400">
                            <Card>
                                <BlockStack gap="200">
                                    <Text as="h3" variant="headingSm" tone="subdued">App Plan Tier</Text>
                                    <Text as="p" variant={stats.plan_name && stats.plan_name !== 'No plan is selected' ? "headingXl" : "headingLg"}>{stats.plan_name || 'No plan is selected'}</Text>
                                    <InlineStack>
                                        <Badge tone={stats.plan_name && stats.plan_name !== 'No plan is selected' ? "success" : "attention"}>
                                            {stats.plan_name && stats.plan_name !== 'No plan is selected' ? "Active Plan" : "Action Required"}
                                        </Badge>
                                    </InlineStack>
                                </BlockStack>
                            </Card>

                            <Card>
                                <BlockStack gap="400">
                                    <Text as="h2" variant="headingMd">Quick Actions</Text>
                                    <InlineStack gap="300" wrap>
                                        <Button variant="primary" onClick={() => navigate('/ProductsList')}>
                                            SKU Generate
                                        </Button>
                                        <Button variant="primary" onClick={() => navigate('/ProductsBarcodeList')}>
                                            Barcode Generate
                                        </Button>
                                        <Button onClick={() => navigate('/TamplateCreate')}>
                                            New Template
                                        </Button>
                                        <Button onClick={() => navigate('/Settingindex')}>
                                            App Settings
                                        </Button>
                                    </InlineStack>
                                </BlockStack>
                            </Card>
                        </BlockStack>
                    </Layout.Section>

                    <Layout.Section>
                        <Promoblock />
                        <div style={{ height: '40px' }}></div>
                    </Layout.Section>
                </Layout>
            </BlockStack>
        </Page>
    );
}