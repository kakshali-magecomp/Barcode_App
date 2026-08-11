import React from "react";

const brandOptions = [
    { label: "Dymo", value: "dymo" },
    { label: "Zebra", value: "zebra" },
    { label: "Avery", value: "avery" },
];

const modelOptionsMap = {
    dymo: [
        {
            label: "30334 (Jewelry Label)",
            value: "30334",
        },
        {
            label: "30252 (Address Label)",
            value: "30252",
        },
    ],

    zebra: [
        {
            label: 'Z-Select 4000D (2" x 1")',
            value: "4000d-2x1",
        },
        {
            label: 'Z-Select 4000D (4" x 6")',
            value: "4000d-4x6",
        },
    ],

    avery: [
        {
            label: '5160 (1" x 2-5/8", 30/sheet)',
            value: "5160",
        },
        {
            label: '5167 (1/2" x 1-3/4", 80/sheet)',
            value: "5167",
        },
    ],
};

export const PAPER_TEMPLATES = {
    dymo: {
        "30334": {
            name: "Jewelry Label",

            type: "roll",

            paper: {
                width: 57,
                height: 32,
            },

            label: {
                width: 57,
                height: 32,
            },

            rows: 1,
            columns: 1,

            gapX: 0,
            gapY: 0,

            marginTop: 0,
            marginLeft: 0,

            roll: {
                coreDiameter: 25.4,
                outerDiameter: null,
                labelsPerRoll: null,
            },
        },

        "30252": {
            name: "Address Label",

            type: "roll",

            paper: {
                width: 89,
                height: 28,
            },

            label: {
                width: 89,
                height: 28,
            },

            rows: 1,
            columns: 1,

            gapX: 0,
            gapY: 0,

            marginTop: 0,
            marginLeft: 0,

            roll: {
                coreDiameter: 25.4,
                outerDiameter: null,
                labelsPerRoll: null,
            },
        },
    },

    zebra: {
        "4000d-2x1": {
            name: 'Z-Select 4000D (2" x 1")',

            type: "roll",

            paper: {
                width: 50.8,
                height: 25.4,
            },

            label: {
                width: 50.8,
                height: 25.4,
            },

            rows: 1,
            columns: 1,

            gapX: 0,
            gapY: 0,

            marginTop: 0,
            marginLeft: 0,

            roll: {
                coreDiameter: 25.4,
                outerDiameter: 127,
                labelsPerRoll: 2340,
            },
        },

        "4000d-4x6": {
            name: 'Z-Select 4000D (4" x 6")',

            type: "sheet",

            paper: {
                width: 101.6,
                height: 152.4,
            },

            label: {
                width: 101.6,
                height: 152.4,
            },

            rows: 1,
            columns: 1,

            gapX: 0,
            gapY: 0,

            marginTop: 0,
            marginLeft: 0,

            roll: null,
        },
    },

    avery: {
        "5160": {
            name: "Avery 5160",

            type: "sheet",

            paper: {
                width: 215.9,
                height: 279.4,
            },

            label: {
                width: 66.7,
                height: 25.4,
            },

            rows: 10,
            columns: 3,

            gapX: 3.2,
            gapY: 0,

            marginTop: 12.7,
            marginLeft: 4.8,

            roll: null,
        },

        "5167": {
            name: "Avery 5167",
            type: "sheet",
            paper: {
                width: 215.9,
                height: 279.4,
            },
            label: {
                width: 44.5,
                height: 12.7,
            },
            rows: 20,
            columns: 4,
            gapX: 5,
            gapY: 0,
            marginTop: 12.7,
            marginLeft: 7.5,
            roll: null,
        },
    },
};


export default function PaperTemplateSettings({
    brand,
    model,
    onBrandChange,
    onModelChange,
}) {
    const models = modelOptionsMap[brand] || [];

    const selectedTemplate =
        PAPER_TEMPLATES?.[brand]?.[model] || null;

    return (
        <div style={{ marginBottom: "16px", marginTop: "16px" }}>
            <s-grid
                gridTemplateColumns="1fr 1fr"
                gap="base"
            >
                {/* BRAND */}

                <s-select
                    label="Paper Brand"
                    value={brand || ""}
                    onChange={(event) => {
                        const value =
                            event.currentTarget.value;

                        onBrandChange(value);

                        // Reset model when brand changes
                        onModelChange("");
                    }}
                >
                    <s-option value="">
                        Select Brand...
                    </s-option>

                    {brandOptions.map((option) => (
                        <s-option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </s-option>
                    ))}
                </s-select>


                {/* MODEL */}

                <s-select
                    label="Paper Model"
                    value={model || ""}
                    onChange={(event) => {
                        onModelChange(
                            event.currentTarget.value
                        );
                    }}
                    disabled={!brand || undefined}
                >
                    <s-option value="">
                        {brand
                            ? "Select Model..."
                            : "Select Brand First"}
                    </s-option>

                    {models.map((option) => (
                        <s-option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </s-option>
                    ))}
                </s-select>
            </s-grid>


            {/* SELECTED PAPER INFORMATION */}

            {selectedTemplate && (
                <div
                    style={{
                        marginTop: "12px",
                        padding: "12px",
                        border: "1px solid #e1e3e5",
                        borderRadius: "8px",
                        background: "#f6f6f7",
                    }}
                >
                    <div
                        style={{
                            fontWeight: 600,
                            marginBottom: "8px",
                        }}
                    >
                        {selectedTemplate.name}
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(3, 1fr)",
                            gap: "8px",
                            fontSize: "13px",
                        }}
                    >
                        <div>
                            <strong>Paper:</strong>{" "}
                            {selectedTemplate.paper.width}
                            mm ×{" "}
                            {selectedTemplate.paper.height}
                            mm
                        </div>

                        <div>
                            <strong>Label:</strong>{" "}
                            {selectedTemplate.label.width}
                            mm ×{" "}
                            {selectedTemplate.label.height}
                            mm
                        </div>

                        <div>
                            <strong>Layout:</strong>{" "}
                            {selectedTemplate.columns} ×{" "}
                            {selectedTemplate.rows}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}