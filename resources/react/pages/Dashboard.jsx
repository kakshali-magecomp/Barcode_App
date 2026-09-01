import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, Text, Badge, Button, BlockStack, InlineStack, Grid, Spinner, Divider, List, Box, Icon } from '@shopify/polaris';
import { CheckCircleIcon, PrintIcon, XIcon, MobileIcon, SettingsIcon, ProductIcon, BarcodeIcon, NoteIcon, ClockIcon, ChevronRightIcon } from '@shopify/polaris-icons';
import { TitleBar } from '@shopify/app-bridge-react';
import { useNavigate } from 'react-router-dom';
import Promoblock from '../components/Promoblock';
import ResourcesBlock from '../components/ResourcesBlock';
import OnboardingCallout from '../components/OnboardingCallout';

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
                        <style>{`
        @keyframes scanline {
            0% { transform: translateY(-2px); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(52px); opacity: 0; }
        }
        @keyframes pulseRing {
            0% { box-shadow: 0 0 0 0 rgba(240, 227, 88, 0.5); }
            100% { box-shadow: 0 0 0 10px rgba(240, 227, 88, 0); }
        }
    `}</style>
                        <div style={{
                            background: 'linear-gradient(115deg, #01161d 0%, #023647 45%, #008ba8 100%)',
                            borderRadius: '12px',
                            padding: '28px 32px',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(1, 22, 29, 0.25)'
                        }}>
                            {/* Barcode-stripe watermark, grounded in the subject matter instead of generic circles */}
                            <div style={{
                                position: 'absolute',
                                right: '-40px',
                                top: 0,
                                bottom: 0,
                                width: '260px',
                                display: 'flex',
                                alignItems: 'stretch',
                                gap: '4px',
                                opacity: 0.06,
                                transform: 'skewX(-12deg)'
                            }}>
                                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1].map((w, i) => (
                                    <div key={i} style={{ width: `${w * 3}px`, background: '#ffffff' }} />
                                ))}
                            </div>

                            <div style={{ zIndex: 1, flex: 1, maxWidth: '580px' }}>
                                <Text as="h2" variant="headingXl" fontWeight="bold">
                                    <span style={{ color: '#ffffff', lineHeight: 1.15 }}>
                                        Optimize your inventory workflow with{' '}
                                    </span>
                                    <span style={{ color: '#f0e358' }}>Barcode & SKU Automation</span>
                                </Text>

                                <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                                    <BlockStack gap="150">
                                        <InlineStack gap="200" wrap={false} blockAlign="center">
                                            <div style={{
                                                background: 'rgba(240, 227, 88, 0.15)',
                                                borderRadius: '6px',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <div style={{ color: '#f0e358', width: '14px' }}>
                                                    <Icon source={CheckCircleIcon} tone="inherit" />
                                                </div>
                                            </div>
                                            <Text as="span" variant="bodyMd" tone="textInverse">
                                                Smarter barcode and SKU generation across your entire catalog
                                            </Text>
                                        </InlineStack>
                                        <InlineStack gap="200" wrap={false} blockAlign="center">
                                            <div style={{
                                                background: 'rgba(240, 227, 88, 0.15)',
                                                borderRadius: '6px',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <div style={{ color: '#f0e358', width: '14px' }}>
                                                    <Icon source={CheckCircleIcon} tone="inherit" />
                                                </div>
                                            </div>
                                            <Text as="span" variant="bodyMd" tone="textInverse">
                                                Integrated with high-resolution custom template printing
                                            </Text>
                                        </InlineStack>
                                    </BlockStack>
                                </div>

                                <Button
                                    onClick={() => navigate('/Settingindex')}
                                    icon={PrintIcon}
                                >
                                    Configure App Settings
                                </Button>
                            </div>

                            {/* Real barcode visual with an animated scan line, replacing the generic icon-in-a-box */}
                            <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingLeft: '24px' }}>
                                <div style={{
                                    background: '#ffffff',
                                    borderRadius: '14px',
                                    padding: '14px 16px',
                                    boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    width: '110px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'stretch', gap: '2px', height: '52px' }}>
                                        {[3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2].map((w, i) => (
                                            <div key={i} style={{ width: `${w}px`, background: '#01161d' }} />
                                        ))}
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        left: '14px',
                                        right: '14px',
                                        height: '2px',
                                        background: '#f0e358',
                                        boxShadow: '0 0 6px 1px rgba(240, 227, 88, 0.8)',
                                        animation: 'scanline 2.2s ease-in-out infinite'
                                    }} />
                                </div>
                                <div style={{
                                    background: '#f0e358',
                                    color: '#01161d',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '3px 10px',
                                    borderRadius: '20px',
                                    animation: 'pulseRing 2.2s infinite'
                                }}>
                                    SKU-0001
                                </div>
                            </div>
                        </div>
                    </Layout.Section>

                    <Layout.Section>
                        <Card>
                            <BlockStack gap="300">
                                <InlineStack align="space-between" blockAlign="start" wrap={false}>
                                    <BlockStack gap="100">
                                        <Text as="h2" variant="headingMd">Getting started</Text>
                                        <Text as="p" tone="subdued">
                                            Follow this flow to go from a new install to your first printed label.
                                        </Text>
                                    </BlockStack>

                                    <button
                                        onClick={() => navigate('/Plan')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '6px 14px 6px 6px',
                                            borderRadius: '30px',
                                            background: 'linear-gradient(90deg, #01161d 0%, #008ba8 100%)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            flexShrink: 0
                                        }}
                                    >
                                        <div style={{
                                            width: '26px',
                                            height: '26px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <div style={{
                                                width: '13px',
                                                height: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                lineHeight: 0,
                                                color: '#f0e358'
                                            }}>
                                                <Icon source={MobileIcon} tone="inherit" />
                                            </div>
                                        </div>
                                        <BlockStack gap="0">
                                            <Text as="span" variant="bodyXs" tone="text-inverse">
                                                <span style={{ opacity: 0.75 }}>Plan</span>
                                            </Text>
                                            <Text as="span" variant="bodySm" fontWeight="semibold" tone="text-inverse">
                                                {stats.plan_name || 'No plan selected'}
                                            </Text>
                                        </BlockStack>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: stats.plan_name && stats.plan_name !== 'No plan is selected' ? '#4ade80' : '#f0e358',
                                            flexShrink: 0
                                        }} />
                                    </button>
                                </InlineStack>

                                <Divider />

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(6, 1fr)',
                                    gap: '8px'
                                }}>
                                    {[
                                        { title: 'App settings', icon: SettingsIcon, path: '/Settingindex' },
                                        { title: 'Generate SKUs', icon: ProductIcon, path: '/ProductsList' },
                                        { title: 'Generate barcodes', icon: BarcodeIcon, path: '/ProductsBarcodeList' },
                                        { title: 'Create template', icon: NoteIcon, path: '/TamplateCreate' },
                                        { title: 'Print labels', icon: PrintIcon, path: '/ProductsBarcodeList' },
                                        { title: 'View history', icon: ClockIcon, path: '/LabelHistory' },
                                    ].map((step) => (
                                        <button
                                            key={step.title}
                                            onClick={() => navigate(step.path)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                gap: '10px',
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: '1px solid #e3e6e8',
                                                background: '#fafbfb',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontFamily: 'inherit',
                                                width: '100%'
                                            }}
                                        >
                                            <div style={{
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '8px',
                                                background: 'linear-gradient(135deg, #01161d 0%, #008ba8 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <div style={{
                                                    width: '15px',
                                                    height: '15px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    lineHeight: 0,
                                                    color: '#ffffff'
                                                }}>
                                                    <Icon source={step.icon} tone="inherit" />
                                                </div>
                                            </div>
                                            <Text as="span" variant="bodySm" fontWeight="medium">
                                                {step.title}
                                            </Text>
                                        </button>
                                    ))}
                                </div>
                            </BlockStack>
                        </Card>
                    </Layout.Section>

                    <Layout.Section>
                        <OnboardingCallout />
                    </Layout.Section>

                    <Layout.Section>
                        <ResourcesBlock />
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