import React, { useState, useCallback } from 'react';
import { Page, Layout, Card, FormLayout, TextField, Select, Banner, Toast, Frame, ContextualSaveBar } from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';

export default function CreateTemplate() {
    const appBridge = useAppBridge();
    const fetch = window.fetch; 
    
    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    
    // Form Dirty State tracking (Controls the Save Bar visibility)
    const [isDirty, setIsDirty] = useState(false);

    // UI Feedback State
    const [loading, setLoading] = useState(false);
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [errorBanner, setErrorBanner] = useState(null);

    // Dropdown Configuration Data
    const brandOptions = [
        { label: 'Select Brand...', value: '' },
        { label: 'Dymo', value: 'dymo' },
        { label: 'Zebra', value: 'zebra' },
        { label: 'Avery', value: 'avery' }
    ];

    const modelOptionsMap = {
        '': [{ label: 'Select Brand First', value: '' }],
        'dymo': [
            { label: 'Select Model...', value: '' },
            { label: '30334 (Jewelry Label)', value: '30334' },
            { label: '30252 (Address Label)', value: '30252' }
        ],
        'zebra': [
            { label: 'Select Model...', value: '' },
            { label: 'Z-Select 4000D (2" x 1")', value: '4000d-2x1' },
            { label: 'Z-Select 4000D (4" x 6")', value: '4000d-4x6' }
        ],
        'avery': [
            { label: 'Select Model...', value: '' },
            { label: '5160 (Address 30-per-sheet)', value: '5160' },
            { label: '5167 (Return Address)', value: '5167' }
        ]
    };

    // State Mutators with Dirty Checks
    const handleFieldChange = (setter) => (value) => {
        setter(value);
        setIsDirty(true);
    };

    const handleBrandChange = (value) => {
        setBrand(value);
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
        if (!name) {
            setErrorBanner('Template Name is required.');
            return;
        }

        setLoading(true);
        setErrorBanner(null);

        try {
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_name: name,
                    description: description,
                    note: note,
                    paper_brand: brand,
                    paper_model: model,
                    layout_settings: { default_columns: 3 }
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setToastMessage('Template saved successfully!');
                setToastActive(true);
                setIsDirty(false); // Hide the Save Bar
            } else {
                setErrorBanner(result.message || 'Failed to save template.');
            }
        } catch (error) {
            setErrorBanner('A server error occurred while saving.');
        } finally {
            setLoading(false);
        }
    }, [name, description, note, brand, model, fetch]);

    return (
        <Frame>
            {/* The Floating Contextual Save Bar at the top */}
            {isDirty && (
                <ContextualSaveBar
                    message="Unsaved changes"
                    saveAction={{
                        label: 'Save template',
                        loading: loading,
                        onAction: handleSubmit,
                    }}
                    discardAction={{
                        label: 'Discard',
                        onAction: handleDiscard,
                    }}
                />
            )}

            <Page title="Create Barcode Template">
                <Layout>
                    <Layout.Section>
                        {errorBanner && (
                            <Banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                                <p>{errorBanner}</p>
                            </Banner>
                        )}
                        
                        <Card padding="500">
                            <FormLayout>
                                <TextField
                                    label="Template Name"
                                    value={name}
                                    onChange={handleFieldChange(setName)}
                                    autoComplete="off"
                                    placeholder="e.g., Standard Dymo Jewelry Label"
                                />
                                
                                <TextField
                                    label="Description"
                                    value={description}
                                    onChange={handleFieldChange(setDescription)}
                                    multiline={3}
                                    autoComplete="off"
                                />

                                <FormLayout.Group>
                                    <Select
                                        label="Paper Brand"
                                        options={brandOptions}
                                        onChange={handleBrandChange}
                                        value={brand}
                                    />
                                    <Select
                                        label="Paper Model"
                                        options={modelOptionsMap[brand] || modelOptionsMap['']}
                                        onChange={handleFieldChange(setModel)}
                                        value={model}
                                        disabled={!brand}
                                    />
                                </FormLayout.Group>

                                <TextField
                                    label="Internal Note"
                                    value={note}
                                    onChange={handleFieldChange(setNote)}
                                    multiline={2}
                                    autoComplete="off"
                                />
                            </FormLayout>
                        </Card>
                    </Layout.Section>
                </Layout>
                {toastActive && <Toast content={toastMessage} onDismiss={() => setToastActive(false)} />}
            </Page>
        </Frame>
    );
}
