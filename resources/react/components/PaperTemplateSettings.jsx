import React from "react";

const brandOptions = [
    { label: "Dymo", value: "dymo" },
    { label: "Zebra", value: "zebra" },
    { label: "Avery", value: "avery" },
    { label: "Custom", value: "custom" },
];

const modelOptionsMap = {
    dymo: [
        {
            label: "30334 (Jewellery Label)",
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
            label: "5160 (1\" x 2-5/8\", 30/sheet)",
            value: "5160",
        },
        {
            label: "5167 (1/2\" x 1-3/4\", 80/sheet)",
            value: "5167",
        },
    ],
    custom: [
        {
            label: "Custom Size",
            value: "custom",
        },
    ],
};

export const PAPER_TEMPLATES = {
    dymo: {
        "30334": {
            name: "Jewellery Label",
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
    customPaper,
    onBrandChange,
    onModelChange,
    onCustomChange,
}) {
    const models = modelOptionsMap[brand] || [];

    const selectedTemplate =
        brand === "custom"
            ? customPaper
            : PAPER_TEMPLATES?.[brand]?.[model] || null;

    const updateCustomPaper = (section, field, value) => {
        onCustomChange({
            ...customPaper,
            [section]: {
                ...customPaper[section],
                [field]: value,
            },
        });
    };

    const updateCustomField = (field, value) => {
        onCustomChange({
            ...customPaper,
            [field]: value,
        });
    };

    return (
        <div style={{ marginBottom: "16px", marginTop: "16px" }}>
            <s-grid
                gridTemplateColumns="1fr 1fr"
                gap="base"
            >
                <s-select
                    label="Paper Brand"
                    value={brand || ""}
                    onChange={(event) => {
                        const value = event.currentTarget.value;

                        onBrandChange(value);

                        if (value === "custom") {
                            onModelChange("custom");
                        } else {
                            onModelChange("");
                        }
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

            {brand === "custom" && model === "custom" && (
                <div
                    style={{
                        marginTop: "12px",
                        padding: "16px",
                        border: "1px solid #e1e3e5",
                        borderRadius: "8px",
                        background: "#f6f6f7",
                    }}
                >
                    <div
                        style={{
                            fontWeight: 600,
                            marginBottom: "12px",
                        }}
                    >
                        Custom Paper Size
                    </div>

                    <s-grid
                        gridTemplateColumns="1fr 1fr"
                        gap="base"
                    >
                        <s-select
                            label="Paper Type"
                            value={customPaper?.type || "sheet"}
                            onChange={(event) => {
                                const value =
                                    event.currentTarget.value;

                                onCustomChange({
                                    ...customPaper,
                                    type: value,
                                    rows:
                                        value === "roll"
                                            ? 1
                                            : customPaper.rows,
                                    columns:
                                        value === "roll"
                                            ? 1
                                            : customPaper.columns,
                                });
                            }}
                        >
                            <s-option value="sheet">
                                Sheet
                            </s-option>

                            <s-option value="roll">
                                Roll
                            </s-option>
                        </s-select>
                    </s-grid>

                    <div style={{ marginTop: "12px" }}>
                        <div
                            style={{
                                fontWeight: 600,
                                marginBottom: "8px",
                            }}
                        >
                            Paper Size
                        </div>

                        <s-grid
                            gridTemplateColumns="1fr 1fr"
                            gap="base"
                        >
                            <s-number-field
                                label="Paper Width"
                                value={
                                    customPaper?.paper?.width || ""
                                }
                                min={0.1}
                                step={0.1}
                                suffix="mm"
                                onInput={(event) =>
                                    updateCustomPaper(
                                        "paper",
                                        "width",
                                        event.currentTarget.value
                                    )
                                }
                            />

                            <s-number-field
                                label="Paper Height"
                                value={
                                    customPaper?.paper?.height || ""
                                }
                                min={0.1}
                                step={0.1}
                                suffix="mm"
                                onInput={(event) =>
                                    updateCustomPaper(
                                        "paper",
                                        "height",
                                        event.currentTarget.value
                                    )
                                }
                            />
                        </s-grid>
                    </div>

                    <div style={{ marginTop: "12px" }}>
                        <div
                            style={{
                                fontWeight: 600,
                                marginBottom: "8px",
                            }}
                        >
                            Label Size
                        </div>

                        <s-grid
                            gridTemplateColumns="1fr 1fr"
                            gap="base"
                        >
                            <s-number-field
                                label="Label Width"
                                value={
                                    customPaper?.label?.width || ""
                                }
                                min={0.1}
                                step={0.1}
                                suffix="mm"
                                onInput={(event) =>
                                    updateCustomPaper(
                                        "label",
                                        "width",
                                        event.currentTarget.value
                                    )
                                }
                            />

                            <s-number-field
                                label="Label Height"
                                value={
                                    customPaper?.label?.height || ""
                                }
                                min={0.1}
                                step={0.1}
                                suffix="mm"
                                onInput={(event) =>
                                    updateCustomPaper(
                                        "label",
                                        "height",
                                        event.currentTarget.value
                                    )
                                }
                            />
                        </s-grid>
                    </div>

                    {customPaper?.type === "sheet" && (
                        <>
                            <div style={{ marginTop: "12px" }}>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        marginBottom: "8px",
                                    }}
                                >
                                    Sheet Layout
                                </div>

                                <s-grid
                                    gridTemplateColumns="1fr 1fr"
                                    gap="base"
                                >
                                    <s-number-field
                                        label="Rows"
                                        value={
                                            customPaper?.rows || 1
                                        }
                                        min={1}
                                        step={1}
                                        onInput={(event) =>
                                            updateCustomField(
                                                "rows",
                                                Math.max(
                                                    1,
                                                    parseInt(
                                                        event
                                                            .currentTarget
                                                            .value
                                                    ) || 1
                                                )
                                            )
                                        }
                                    />

                                    <s-number-field
                                        label="Columns"
                                        value={
                                            customPaper?.columns || 1
                                        }
                                        min={1}
                                        step={1}
                                        onInput={(event) =>
                                            updateCustomField(
                                                "columns",
                                                Math.max(
                                                    1,
                                                    parseInt(
                                                        event
                                                            .currentTarget
                                                            .value
                                                    ) || 1
                                                )
                                            )
                                        }
                                    />

                                    <s-number-field
                                        label="Horizontal Gap"
                                        value={
                                            customPaper?.gapX ?? 0
                                        }
                                        min={0}
                                        step={0.1}
                                        suffix="mm"
                                        onInput={(event) =>
                                            updateCustomField(
                                                "gapX",
                                                event.currentTarget.value
                                            )
                                        }
                                    />

                                    <s-number-field
                                        label="Vertical Gap"
                                        value={
                                            customPaper?.gapY ?? 0
                                        }
                                        min={0}
                                        step={0.1}
                                        suffix="mm"
                                        onInput={(event) =>
                                            updateCustomField(
                                                "gapY",
                                                event.currentTarget.value
                                            )
                                        }
                                    />
                                </s-grid>
                            </div>

                            <div style={{ marginTop: "12px" }}>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        marginBottom: "8px",
                                    }}
                                >
                                    Margins
                                </div>

                                <s-grid
                                    gridTemplateColumns="1fr 1fr"
                                    gap="base"
                                >
                                    <s-number-field
                                        label="Top Margin"
                                        value={
                                            customPaper?.marginTop ?? 0
                                        }
                                        min={0}
                                        step={0.1}
                                        suffix="mm"
                                        onInput={(event) =>
                                            updateCustomField(
                                                "marginTop",
                                                event.currentTarget.value
                                            )
                                        }
                                    />

                                    <s-number-field
                                        label="Left Margin"
                                        value={
                                            customPaper?.marginLeft ?? 0
                                        }
                                        min={0}
                                        step={0.1}
                                        suffix="mm"
                                        onInput={(event) =>
                                            updateCustomField(
                                                "marginLeft",
                                                event.currentTarget.value
                                            )
                                        }
                                    />
                                </s-grid>
                            </div>
                        </>
                    )}

                    <div
                        style={{
                            marginTop: "12px",
                            padding: "10px",
                            background: "#ffffff",
                            border: "1px solid #e1e3e5",
                            borderRadius: "6px",
                            fontSize: "13px",
                        }}
                    >
                        <strong>Paper:</strong>{" "}
                        {customPaper?.paper?.width || 0} mm ×{" "}
                        {customPaper?.paper?.height || 0} mm
                        <br />
                        <strong>Label:</strong>{" "}
                        {customPaper?.label?.width || 0} mm ×{" "}
                        {customPaper?.label?.height || 0} mm
                    </div>
                </div>
            )}

            {brand !== "custom" && selectedTemplate && (
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