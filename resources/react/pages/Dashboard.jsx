import React, { useState, useEffect } from 'react';

export default function Dashboard() {
    const [stats, setStats] = useState({ templates_count: 0, products_count: 0 });
    const [loading, setLoading] = useState(true);

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
    }, []);

    if (loading) {
        return (
            <s-page heading="Dashboard">
                <s-box padding="loose" alignContent="center">
                    <s-spinner accessibilityLabel="Loading dashboard" size="large" />
                </s-box>
            </s-page>
        );
    }

    return (
        <s-page heading="Dashboard" subheading="Welcome to your Barcode Labels & SKU Automation hub.">

            <s-section>
                <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="base">
                    <s-box padding="base" borderWidth="base" borderRadius="base">
                        <s-stack direction="block" gap="tight">
                            <s-text tone="subdued" fontWeight="medium">Custom Layout Templates</s-text>
                            <s-heading>{stats.templates_count}</s-heading>
                            <s-badge tone="success">Active Layouts</s-badge>
                        </s-stack>
                    </s-box>

                    <s-box padding="base" borderWidth="base" borderRadius="base">
                        <s-stack direction="block" gap="tight">
                            <s-text tone="subdued" fontWeight="medium">Total Sync Products</s-text>
                            <s-heading>{stats.products_count}</s-heading>
                            <s-badge tone="info">Live Catalog Feed</s-badge>
                        </s-stack>
                    </s-box>

                    <s-box padding="base" borderWidth="base" borderRadius="base">
                        <s-stack direction="block" gap="tight">
                            <s-text tone="subdued" fontWeight="medium">App Plan Tier</s-text>
                            <s-heading>Free Tier Mode</s-heading>
                            <s-badge tone="attention">Basic Standard</s-badge>
                        </s-stack>
                    </s-box>
                </s-grid>
            </s-section>

            <s-section>
                <s-grid gridTemplateColumns="1fr 2fr" gap="base">

                    <s-box padding="base" borderWidth="base" borderRadius="base">
                        <s-stack direction="block" gap="base">
                            <s-heading>Quick Actions</s-heading>
                            <s-button variant="primary" href="/ProductsList">
                                SKU Generate
                            </s-button>
                            <s-button variant="primary" href="/ProductsBarcodeList">
                                Barcode Generate
                            </s-button>
                            <s-button href="/TamplateCreate">
                                Create Custom Template
                            </s-button>
                            <s-button href="/Settingindex">
                                Adjust App Settings
                            </s-button>
                        </s-stack>
                    </s-box>

                    <s-box padding="base" borderWidth="base" borderRadius="base">
                        <s-stack direction="block" gap="base">
                            <s-heading>Application Getting Started Guide</s-heading>
                            <s-paragraph tone="subdued">
                                Follow these steps to configure high-resolution printing automation profiles across your warehouse:
                            </s-paragraph>
                            <s-ordered-list>
                                <s-list-item>
                                    Go to the <s-text fontWeight="bold">SKU Generation</s-text> sub-panel settings page to set up automated numbering schema sequences for incoming variants.
                                </s-list-item>
                                <s-list-item>
                                    Build custom print size layout blueprints matching your sticky label rolls inside the <s-text fontWeight="bold">Templates Manager</s-text>.
                                </s-list-item>
                                <s-list-item>
                                    Head over to the <s-text fontWeight="bold">Products Catalog Grid</s-text>, select your target lines via checkboxes, and initiate batch printing operations directly.
                                </s-list-item>
                            </s-ordered-list>
                        </s-stack>
                    </s-box>
                </s-grid>
            </s-section>
        </s-page>
    );
}