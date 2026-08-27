import React, { useEffect, useMemo, useState } from "react";

export default function PlanPage() {
    const [plans, setPlans] = useState([]);
    const [selectedInterval, setSelectedInterval] = useState("monthly");
    const [loading, setLoading] = useState(true);
    const [subscribingInterval, setSubscribingInterval] = useState(null);
    const [error, setError] = useState("");
    const [activePlanId, setActivePlanId] = useState(null);

    const features = [
        "Create unlimited barcode labels",
        "Generate SKU automatically",
        "Generate barcodes",
        "Print product labels",
        "Create custom label templates",
        "Product and variant support",
        "Barcode and QR code support",
        "All core app features",
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

            const activePlanObj = loadedPlans.find(
                (plan) => Number(plan.id) === Number(resolvedActiveId)
            );

            if (activePlanObj) {
                setSelectedInterval(activePlanObj.billing_period);
            }
        } catch (error) {
            console.error("Plan loading error:", error);
            setError(error.message || "Unable to load plans.");
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
            setSelectedInterval(interval);
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
        } catch (error) {
            console.error("Subscription error:", error);
            setError(error.message || "Unable to start subscription.");
            setSubscribingInterval(null);
        }
    };

    if (loading) {
        return (
            <s-box inlineSize="100%" padding="large">
                <s-stack direction="block" alignItems="center" gap="base" inlineSize="100%">
                    <s-spinner size="base" accessibilityLabel="Loading plans"></s-spinner>
                    <s-text tone="neutral">Loading plans...</s-text>
                </s-stack>
            </s-box>
        );
    }

    const isAnySubscribing = subscribingInterval !== null;

    const getActivePlanRank = () => {
        if (activePlanId == null) return null;
        if (monthlyPlan && Number(monthlyPlan.id) === Number(activePlanId)) return "monthly";
        if (yearlyPlan && Number(yearlyPlan.id) === Number(activePlanId)) return "yearly";
        return null;
    };

    const renderPlanCard = (plan, interval, title) => {
        if (!plan) return null;

        const isActive =
            activePlanId != null && Number(plan.id) === Number(activePlanId);
        const isThis = subscribingInterval === interval;
        const activeRank = getActivePlanRank();

        let buttonLabel = `Choose ${interval}`;
        if (isActive) {
            buttonLabel = "Current plan";
        } else if (activeRank === "yearly" && interval === "monthly") {
            buttonLabel = "Monthly plan";
        } else if (activeRank === "monthly" && interval === "yearly") {
            buttonLabel = "Upgrade plan";
        } else if (isThis) {
            buttonLabel = "Opening Shopify...";
        }

        return (

            <s-box inlineSize="360px" maxInlineSize="100%" padding="large" background="base" border="base" borderRadius="large">
                <s-stack direction="block" gap="base">
                    <s-stack direction="inline" alignItems="center" gap="small">
                        <s-text type="strong">{title}</s-text>
                        {isActive && <s-badge tone="success">Current plan</s-badge>}
                    </s-stack>

                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span style={{ fontSize: "26px", lineHeight: "32px", fontWeight: 700, color: "#1a1a1a" }}>
                            ${plan.price}
                        </span>
                        <span style={{ fontSize: "14px", lineHeight: "20px", fontWeight: 400, color: "#6b6b6b" }}>
                            / {interval === "monthly" ? "month" : "year"}
                        </span>
                    </div>

                    <s-unordered-list>
                        {features.map((feature, index) => (
                            <s-list-item key={index}>{feature}</s-list-item>
                        ))}
                    </s-unordered-list>

                    <s-button
                        inlineSize="fill"
                        variant={isActive ? "secondary" : "primary"}
                        disabled={isActive || (isAnySubscribing && !isThis)}
                        loading={isThis}
                        accessibilityLabel={buttonLabel}
                        onClick={() => handleSubscribe(plan, interval)}
                    >
                        {buttonLabel}
                    </s-button>
                </s-stack>
            </s-box>
        );
    };

    return (
        <s-box inlineSize="100%" padding="none">
            <s-query-container>
                <s-stack direction="block" alignItems="center" inlineSize="100%" gap="large">
                    <h1 style={{ margin: "0", fontSize: "25px", lineHeight: "34px", fontWeight: "700" }}>
                        Select a plan
                    </h1>

                    {error && (
                        <s-banner tone="critical" heading="Unable to process request">
                            {error}
                        </s-banner>
                    )}

                    {/* {activePlanId === null && (
                        <s-banner tone="caution" heading="No active plan">
                            Choose a plan below to activate your subscription.
                        </s-banner>
                    )} */}

                    {(monthlyPlan || yearlyPlan) && (
                        <s-stack direction="inline" gap="large" wrap="wrap" alignItems="start" justifyContent="center">
                            {renderPlanCard(monthlyPlan, "monthly", "Basic monthly")}
                            {renderPlanCard(yearlyPlan, "yearly", "Basic yearly")}
                        </s-stack>
                    )}

                    {!monthlyPlan && !yearlyPlan && !loading && (
                        <s-box inlineSize="100%" padding="large" background="subdued" border="base" borderRadius="large">
                            <s-stack direction="block" alignItems="center" gap="base">
                                <s-text tone="neutral">No plans are available.</s-text>
                            </s-stack>
                        </s-box>
                    )}
                </s-stack>
            </s-query-container>
        </s-box>
    );
}