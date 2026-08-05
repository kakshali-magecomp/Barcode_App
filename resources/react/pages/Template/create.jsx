import React, { useState, useCallback, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useNavigate } from 'react-router-dom';

const SAVE_BAR_ID = 'create-template-save-bar';

export default function CreateTemplate() {
    
    const shopify = useAppBridge();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');

    const [isDirty, setIsDirty] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);

    const brandOptions = [
        { label: 'Dymo', value: 'dymo' },
        { label: 'Zebra', value: 'zebra' },
        { label: 'Avery', value: 'avery' }
    ];

    const modelOptionsMap = {
        '': [],
        'dymo': [
            { label: '30334 (Jewelry Label)', value: '30334' },
            { label: '30252 (Address Label)', value: '30252' }
        ],
        'zebra': [
            { label: 'Z-Select 4000D (2" x 1")', value: '4000d-2x1' },
            { label: 'Z-Select 4000D (4" x 6")', value: '4000d-4x6' }
        ],
        'avery': [
            { label: '5160 (Address 30-per-sheet)', value: '5160' },
            { label: '5167 (Return Address)', value: '5167' }
        ]
    };

    const PAPER_TEMPLATES = {
        dymo: {
            "30334": { name: "Jewelry Label", paper: { width: 54, height: 25 }, label: { width: 54, height: 25 }, rows: 1, columns: 1, gapX: 0, gapY: 0, marginTop: 0, marginLeft: 0 },
            "30252": { name: "Address Label", paper: { width: 89, height: 36 }, label: { width: 89, height: 36 }, rows: 1, columns: 1, gapX: 0, gapY: 0, marginTop: 0, marginLeft: 0 }
        },
        zebra: {
            "4000d-4x6": { name: "Shipping Label", paper: { width: 101.6, height: 152.4 }, label: { width: 101.6, height: 152.4 }, rows: 1, columns: 1, gapX: 0, gapY: 0 },
            "4000d-2x1": { name: "Small Label", paper: { width: 50.8, height: 25.4 }, label: { width: 50.8, height: 25.4 }, rows: 1, columns: 1, gapX: 0, gapY: 0 }
        },
        avery: {
            "5160": { name: "Address", paper: { width: 215.9, height: 279.4 }, label: { width: 66.7, height: 25.4 }, rows: 10, columns: 3, gapX: 3.2, gapY: 0, marginTop: 12.7, marginLeft: 4.8 },
            "5167": { name: "ReturnAddress", paper: { width: 215.9, height: 279.4 }, label: { width: 66.7, height: 279.6 }, rows: 10, columns: 3, gapx: 3.2, gapy: 0, marginTop: 12.7, marginLeft: 4.8 }
        }
    };

    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show(SAVE_BAR_ID);
        } else {
            shopify.saveBar.hide(SAVE_BAR_ID);
        }
    }, [isDirty, shopify]);

    const handleFieldChange = (setter) => (event) => {
        setter(event.currentTarget.value);
        setIsDirty(true);
    };

    const handleBrandChange = (event) => {
        setBrand(event.currentTarget.value);
        setModel(''); // Reset model selection when brand shifts
        setIsDirty(true);
    };

    const handleDiscard = useCallback(() => {
        setName('');
        setDescription('');
        setNote('');
        setBrand('');
        setModel('');
        setIsDirty(false);
        setErrorBanner(null);
    }, []);

    // Form Submission
    const handleSubmit = useCallback(async () => {
        if (!name.trim()) {
            setErrorBanner("Template name is required.");
            return;
        }
        if (!brand) {
            setErrorBanner("Please select a paper brand.");
            return;
        }
        if (!model) {
            setErrorBanner("Please select a paper model.");
            return;
        }

        const selectedTemplate = PAPER_TEMPLATES?.[brand]?.[model];
        if (!selectedTemplate) {
            setErrorBanner("Invalid paper template selected.");
            return;
        }

        setLoading(true);
        setErrorBanner(null);
        try {
            const response = await fetch("/api/templates", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    template_name: name,
                    description: description,
                    note: note,
                    paper_brand: brand,
                    paper_model: model,
                    layout_settings: { ...selectedTemplate }
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Failed to save template.");
            }

            if (result.success) {

                shopify.toast.show("Template created successfully.");
                setIsDirty(false);
                navigate(`/templates/design/${result.data.id}`);
            } else {
                setErrorBanner(result.message || "Failed to save template.");
            }
        } catch (error) {
            console.error(error);
            setErrorBanner(error.message || "A server error occurred while saving.");
        } finally {
            setLoading(false);
        }
    }, [name, description, note, brand, model, navigate, shopify]);

    return (
        <>
            <ui-save-bar id={SAVE_BAR_ID}>
                <button variant="primary" loading={loading || undefined} onClick={handleSubmit}>
                    Save template
                </button>
                <button onClick={handleDiscard}>Discard</button>
            </ui-save-bar>

            <s-page heading="Create Barcode Template">
                <s-section>
                    <s-link href="/TemplateList">← Back to Templates</s-link>
                </s-section>

                <s-section>
                    {errorBanner && (
                        <s-banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                            {errorBanner}
                        </s-banner>
                    )}

                    <s-stack direction="block" gap="base">
                        <s-text-field
                            label="Template Name"
                            value={name}
                            onInput={handleFieldChange(setName)}
                            placeholder="e.g., Standard Dymo Label"
                        />

                        <s-text-area
                            label="Description"
                            value={description}
                            onInput={handleFieldChange(setDescription)}
                            rows={3}
                        />

                        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                            <s-select label="Paper Brand" value={brand} onChange={handleBrandChange}>
                                <s-option value="">Select Brand...</s-option>
                                {brandOptions.map((opt) => (
                                    <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                ))}
                            </s-select>

                            <s-select label="Paper Model" value={model} onChange={handleFieldChange(setModel)} disabled={!brand || undefined}>
                                <s-option value="">{brand ? 'Select Model...' : 'Select Brand First'}</s-option>
                                {(modelOptionsMap[brand] || []).map((opt) => (
                                    <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                ))}
                            </s-select>
                        </s-grid>

                        <s-text-area
                            label="Internal Note"
                            value={note}
                            onInput={handleFieldChange(setNote)}
                            rows={2}
                        />
                    </s-stack>
                </s-section>
            </s-page>
        </>
    );
}