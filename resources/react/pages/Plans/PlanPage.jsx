import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

export default function PlanPage() {
    const [plans, setPlans] = useState([]);
    const [selectedInterval, setSelectedInterval] =
        useState("monthly");

    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] =
        useState(false);

    const [error, setError] = useState("");

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
        const params = new URLSearchParams(
            window.location.search
        );

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

            const response = await fetch(
                "/api/plans",
                {
                    method: "GET",

                    headers: {
                        Accept: "application/json",
                    },

                    credentials: "include",
                }
            );

            const data = await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to load plans."
                );
            }

            setPlans(
                Array.isArray(data.plans)
                    ? data.plans
                    : []
            );
        } catch (error) {
            console.error(
                "Plan loading error:",
                error
            );

            setError(
                error.message ||
                "Unable to load plans."
            );
        } finally {
            setLoading(false);
        }
    };

   

    const monthlyPlan = useMemo(() => {
        return plans.find(
            (plan) =>
                plan.billing_period ===
                "monthly"
        );
    }, [plans]);

  

    const yearlyPlan = useMemo(() => {
        return plans.find(
            (plan) =>
                plan.billing_period ===
                "yearly"
        );
    }, [plans]);

    

    const selectedPlan =
        selectedInterval === "monthly"
            ? monthlyPlan
            : yearlyPlan;

  

    const handleSubscribe = async () => {
        if (
            !selectedPlan ||
            subscribing
        ) {
            return;
        }

        try {
            setSubscribing(true);
            setError("");

           

            const {
                shop,
                host,
                embedded,
            } = getShopifyContext();

            console.log(
                "Shopify subscription context:",
                {
                    shop,
                    host,
                    embedded,
                }
            );


            if (!host) {
                throw new Error(
                    "Shopify host parameter is missing. Please reopen the app from Shopify Admin."
                );
            }

        

            const params = new URLSearchParams();

            params.set(
                "host",
                host
            );

            if (shop) {
                params.set(
                    "shop",
                    shop
                );
            }

            if (embedded) {
                params.set(
                    "embedded",
                    embedded
                );
            }

           

            const response =
                await fetch(
                    `/api/plans/${selectedPlan.id}/subscribe?${params.toString()}`,
                    {
                        method: "POST",

                        headers: {
                            Accept:
                                "application/json",
                        },

                        credentials:
                            "include",
                    }
                );

            const data =
                await response.json();

            console.log(
                "Subscription response:",
                data
            );

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to start subscription."
                );
            }


            if (data.billing_url) {
                window.top.location.href =
                    data.billing_url;

                return;
            }

            throw new Error(
                "Billing URL was not returned."
            );
        } catch (error) {
            console.error(
                "Subscription error:",
                error
            );

            setError(
                error.message ||
                "Unable to start subscription."
            );

            setSubscribing(false);
        }
    };


    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#f6f6f7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        "center",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
            >
                <div
                    style={{
                        fontSize: "14px",
                        color: "#616161",
                    }}
                >
                    Loading plans...
                </div>
            </div>
        );
    }


    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100%",
                background: "#f6f6f7",
                boxSizing: "border-box",
                padding: 0,
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    margin: "0 auto",
                    padding:
                        "4px 20px 40px",
                    boxSizing:
                        "border-box",
                }}
            >
                {/* Page title */}

                <div
                    style={{
                        paddingBottom:
                            "20px",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            padding: 0,
                            fontSize: "21px",
                            lineHeight:
                                "28px",
                            fontWeight: 700,
                            color: "#303030",
                        }}
                    >
                        Select a plan
                    </h1>
                </div>

                {/* Error */}

                {error && (
                    <div
                        style={{
                            background:
                                "#fff4f4",
                            border:
                                "1px solid #e0b3b3",
                            color: "#b42318",
                            borderRadius:
                                "8px",
                            padding: "12px",
                            marginBottom:
                                "16px",
                            fontSize: "13px",
                            lineHeight:
                                "20px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Plan card */}

                {selectedPlan && (
                    <div
                        style={{
                            width: "100%",
                            backgroundColor:
                                "#ffffff",
                            border:
                                "1px solid #d1d1d1",
                            borderRadius:
                                "12px",
                            padding: "16px",
                            boxSizing:
                                "border-box",
                            boxShadow:
                                "0 1px 2px rgba(0, 0, 0, 0.04)",
                        }}
                    >
                        {/* Plan name */}

                        <div
                            style={{
                                fontSize: "15px",
                                lineHeight:
                                    "22px",
                                fontWeight: 700,
                                color: "#303030",
                                marginBottom:
                                    "10px",
                            }}
                        >
                            {selectedPlan.name}
                        </div>

                        {/* Price */}

                        <div
                            style={{
                                display: "flex",
                                alignItems:
                                    "baseline",
                                marginBottom:
                                    "4px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize:
                                        "25px",
                                    lineHeight:
                                        "31px",
                                    fontWeight:
                                        700,
                                    color:
                                        "#303030",
                                }}
                            >
                                $
                                {
                                    selectedPlan.price
                                }
                            </span>

                            <span
                                style={{
                                    marginLeft:
                                        "4px",
                                    fontSize:
                                        "13px",
                                    lineHeight:
                                        "20px",
                                    color:
                                        "#616161",
                                }}
                            >
                                /
                                {selectedInterval ===
                                "monthly"
                                    ? "month"
                                    : "year"}
                            </span>
                        </div>

                        {/* Secondary price */}

                        <div
                            style={{
                                fontSize: "13px",
                                lineHeight:
                                    "20px",
                                color:
                                    "#616161",
                                marginBottom:
                                    "14px",
                            }}
                        >
                            {selectedInterval ===
                            "monthly"
                                ? yearlyPlan
                                    ? `$${yearlyPlan.price} / year`
                                    : ""
                                : monthlyPlan
                                  ? `$${monthlyPlan.price} / month`
                                  : ""}
                        </div>

                        {/* Monthly */}

                        <button
                            type="button"
                            onClick={() =>
                                setSelectedInterval(
                                    "monthly"
                                )
                            }
                            style={{
                                width: "100%",
                                height: "29px",
                                padding:
                                    "0 12px",
                                margin: 0,
                                marginBottom:
                                    "7px",
                                borderRadius:
                                    "7px",
                                border:
                                    selectedInterval ===
                                    "monthly"
                                        ? "1px solid #1f1f1f"
                                        : "1px solid #c7c7c7",
                                background:
                                    selectedInterval ===
                                    "monthly"
                                        ? "linear-gradient(#424242, #252525)"
                                        : "#ffffff",
                                color:
                                    selectedInterval ===
                                    "monthly"
                                        ? "#ffffff"
                                        : "#424242",
                                fontSize:
                                    "12px",
                                lineHeight:
                                    "16px",
                                fontWeight:
                                    600,
                                textAlign:
                                    "center",
                                cursor:
                                    "pointer",
                                boxSizing:
                                    "border-box",
                                outline: "none",
                            }}
                        >
                            Choose monthly
                        </button>

                        {/* Yearly */}

                        <button
                            type="button"
                            onClick={() =>
                                setSelectedInterval(
                                    "yearly"
                                )
                            }
                            style={{
                                width: "100%",
                                height: "29px",
                                padding:
                                    "0 12px",
                                margin: 0,
                                marginBottom:
                                    "16px",
                                borderRadius:
                                    "7px",
                                border:
                                    selectedInterval ===
                                    "yearly"
                                        ? "1px solid #1f1f1f"
                                        : "1px solid #c7c7c7",
                                background:
                                    selectedInterval ===
                                    "yearly"
                                        ? "linear-gradient(#424242, #252525)"
                                        : "#ffffff",
                                color:
                                    selectedInterval ===
                                    "yearly"
                                        ? "#ffffff"
                                        : "#424242",
                                fontSize:
                                    "12px",
                                lineHeight:
                                    "16px",
                                fontWeight:
                                    600,
                                textAlign:
                                    "center",
                                cursor:
                                    "pointer",
                                boxSizing:
                                    "border-box",
                                outline: "none",
                            }}
                        >
                            Choose yearly
                        </button>

                        {/* Features */}

                        <ul
                            style={{
                                margin: 0,
                                padding:
                                    "0 0 0 20px",
                                color:
                                    "#303030",
                            }}
                        >
                            {features.map(
                                (
                                    feature,
                                    index
                                ) => (
                                    <li
                                        key={
                                            index
                                        }
                                        style={{
                                            fontSize:
                                                "13px",
                                            lineHeight:
                                                "20px",
                                            marginBottom:
                                                index ===
                                                features.length -
                                                    1
                                                    ? "0"
                                                    : "4px",
                                            padding: 0,
                                        }}
                                    >
                                        {
                                            feature
                                        }
                                    </li>
                                )
                            )}
                        </ul>

                        {/* Subscribe button */}

                        <button
                            type="button"
                            onClick={
                                handleSubscribe
                            }
                            disabled={
                                subscribing
                            }
                            style={{
                                width: "100%",
                                height: "38px",
                                marginTop:
                                    "20px",
                                borderRadius:
                                    "7px",
                                border:
                                    "1px solid #1f1f1f",
                                background:
                                    subscribing
                                        ? "#777777"
                                        : "#303030",
                                color:
                                    "#ffffff",
                                fontSize:
                                    "13px",
                                fontWeight:
                                    600,
                                cursor:
                                    subscribing
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >
                            {subscribing
                                ? "Opening Shopify..."
                                : selectedInterval ===
                                    "monthly"
                                  ? "Continue with monthly"
                                  : "Continue with yearly"}
                        </button>
                    </div>
                )}

                {/* No plans */}

                {!selectedPlan &&
                    !loading && (
                        <div
                            style={{
                                background:
                                    "#ffffff",
                                border:
                                    "1px solid #d1d1d1",
                                borderRadius:
                                    "12px",
                                padding: "20px",
                                textAlign:
                                    "center",
                                color:
                                    "#616161",
                                fontSize:
                                    "13px",
                            }}
                        >
                            No plans are
                            available.
                        </div>
                    )}
            </div>
        </div>
    );
}