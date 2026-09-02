import React, { useEffect, useMemo, useState } from "react";
import { Page, Card, Text, Badge, Button, BlockStack, InlineStack, Spinner, Banner, Divider } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function PlanPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subscribingInterval, setSubscribingInterval] = useState(null);
    const [error, setError] = useState("");
    const [activePlanId, setActivePlanId] = useState(null);

    const featuresList = [
        "Unlimited barcode & label printing",
        "Automatic SKU generator",
        "Supports Code 128, EAN, UPC & QR codes",
        "Custom label templates & designs",
        "Product & inventory sync",
        "Print prices & currencies on labels",
        "P2P customer support",
    ];

    const getShopifyContext = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            shop: params.get("shop"),
            host: params.get("host"),
            embedded: params.get("embedded"),
        };
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/plans", {
                method: "GET",
                headers: { Accept: "application/json" },
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load plans.");
            }

            const loadedPlans = Array.isArray(data.plans) ? data.plans : [];
            setPlans(loadedPlans);

            const resolvedActiveId =
                data.active_plan_id != null ? Number(data.active_plan_id) : null;
            setActivePlanId(resolvedActiveId);
        } catch (err) {
            console.error("Plan loading error:", err);
            setError(err.message || "Unable to load plans.");
        } finally {
            setLoading(false);
        }
    };

    const monthlyPlan = useMemo(
        () => plans.find((plan) => plan.billing_period === "monthly"),
        [plans]
    );

    const yearlyPlan = useMemo(
        () => plans.find((plan) => plan.billing_period === "yearly"),
        [plans]
    );

    const handleSubscribe = async (plan, interval) => {
        if (!plan || subscribingInterval) return;

        try {
            setSubscribingInterval(interval);
            setError("");

            const { shop, host, embedded } = getShopifyContext();

            if (!host) {
                throw new Error(
                    "Shopify host parameter is missing. Please reopen the app from Shopify Admin."
                );
            }

            const params = new URLSearchParams();
            params.set("host", host);
            if (shop) params.set("shop", shop);
            if (embedded) params.set("embedded", embedded);

            const response = await fetch(
                `/api/plans/${plan.id}/subscribe?${params.toString()}`,
                {
                    method: "POST",
                    headers: { Accept: "application/json" },
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to start subscription.");
            }

            if (data.billing_url) {
                window.top.location.href = data.billing_url;
                return;
            }

            throw new Error("Billing URL was not returned.");
        } catch (err) {
            console.error("Subscription error:", err);
            setError(err.message || "Unable to start subscription.");
            setSubscribingInterval(null);
        }
    };

    if (loading) {
        return (
            <Page fullWidth>
                <TitleBar title="barcodedemo-app" />
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "350px" }}>
                    <BlockStack gap="300" align="center">
                        <Spinner accessibilityLabel="Loading subscription plans" size="large" />
                        <Text tone="subdued" variant="bodyLg">Loading available subscription plans...</Text>
                    </BlockStack>
                </div>
            </Page>
        );
    }

    const isAnySubscribing = subscribingInterval !== null;

    const getActivePlanRank = () => {
        if (activePlanId == null) return null;
        if (monthlyPlan && Number(monthlyPlan.id) === Number(activePlanId)) return "monthly";
        if (yearlyPlan && Number(yearlyPlan.id) === Number(activePlanId)) return "yearly";
        return null;
    };

    const activeRank = getActivePlanRank();

    const renderCard = (plan, interval, cardTitle) => {
        if (!plan) return null;

        const isActive = activePlanId != null && Number(plan.id) === Number(activePlanId);
        const isThisSubscribing = subscribingInterval === interval;

        let buttonText = `Choose ${interval}`;
        if (isActive) {
            buttonText = "Current plan";
        } else if (activeRank === "yearly" && interval === "monthly") {
            buttonText = "Monthly plan";
        } else if (activeRank === "monthly" && interval === "yearly") {
            buttonText = "Upgrade plan";
        } else if (isThisSubscribing) {
            buttonText = "Opening Shopify...";
        }

        return (
            <div
                style={{
                    flex: '1 1 320px',
                    maxWidth: '420px',
                    position: 'relative',
                    borderRadius: '14px',
                    background: '#ffffff',
                    border: isActive ? '2px solid #008060' : '1px solid #e1e3e5',
                    boxShadow: isActive
                        ? '0 8px 24px rgba(0, 128, 96, 0.14)'
                        : '0 2px 10px rgba(0, 0, 0, 0.04)',
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* TITLE & ACTIVE STATUS BADGE */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
                            {cardTitle}
                        </h3>
                        {isActive && (
                            <Badge tone="success" size="large">Current plan</Badge>
                        )}
                    </div>

                    {/* PRICING */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '32px', fontWeight: '800', color: '#01161d', lineHeight: '1' }}>
                            ${plan.price}
                        </span>
                        <span style={{ fontSize: '14px', color: '#6d7175', fontWeight: '500' }}>
                            / {interval === 'monthly' ? 'month' : 'year'}
                        </span>
                    </div>

                    <p style={{ color: '#6d7175', fontSize: '12px', margin: 0, lineHeight: '1.3' }}>
                        {interval === 'monthly'
                            ? "Billed monthly. Cancel or switch anytime."
                            : "Billed annually. Save with yearly billing."}
                    </p>

                    <div style={{ height: '1px', background: '#e1e3e5', margin: '2px 0' }} />

                    {/* FEATURES */}
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#6d7175', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' }}>
                            WHAT'S INCLUDED:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {featuresList.map((feat, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: '#e0f7fa',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <svg
                                            width="10"
                                            height="10"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#008ba8"
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ display: 'block' }}
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#202223', fontWeight: '500', lineHeight: '1.2' }}>
                                        {feat}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SUBSCRIBE BUTTON */}
                <div style={{ marginTop: '20px' }}>
                    <Button
                        fullWidth
                        size="large"
                        variant={isActive ? "secondary" : "primary"}
                        disabled={isActive || (isAnySubscribing && !isThisSubscribing)}
                        loading={isThisSubscribing}
                        onClick={() => handleSubscribe(plan, interval)}
                    >
                        {buttonText}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <Page fullWidth>
            <TitleBar title="barcodedemo-app" />

            <div style={{ padding: '0 4px' }}>
                <s-section>
                    {/* UNIFIED PAGE HEADER (MATCHES OTHER PAGES) */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div>
                            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a1a", margin: 0 }}>
                                Subscription & Billing Plans
                            </h1>
                            <p style={{ fontSize: "13px", color: "#6d7175", margin: "4px 0 0 0" }}>
                                Select a subscription plan to unlock unlimited barcode label printing and SKU features.
                            </p>
                        </div>
                    </div>

                    {/* ERROR BANNER */}
                    {error && (
                        <div style={{ marginBottom: '16px' }}>
                            <Banner tone="critical" title="Subscription Error">
                                <p>{error}</p>
                            </Banner>
                        </div>
                    )}

                    {/* PLAN CARDS GRID - COMPACT ZERO SCROLL */}
                    {(monthlyPlan || yearlyPlan) ? (
                        <div
                            style={{
                                display: 'flex',
                                gap: '20px',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                                alignItems: 'stretch',
                            }}
                        >
                            {renderCard(monthlyPlan, "monthly", "Basic monthly")}
                            {renderCard(yearlyPlan, "yearly", "Basic yearly")}
                        </div>
                    ) : (
                        <Card>
                            <div style={{ textAlign: 'center', padding: '30px' }}>
                                <Text tone="subdued">No subscription plans are currently available.</Text>
                            </div>
                        </Card>
                    )}
                </s-section>
            </div>
        </Page>
    );
}