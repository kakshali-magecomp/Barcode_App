import React, { useState, useCallback, useEffect } from 'react';
import { Page, Layout, Card, FormLayout, TextField, Select, Banner, Toast, Frame, ContextualSaveBar, Box, Spinner } from '@shopify/polaris';
import { useAppBridge, SaveBar } from '@shopify/app-bridge-react';
import { useParams, useNavigate } from 'react-router-dom';
import DesignCanvasEdit from '../../components/DesignCanvasEdit.jsx';

export default function EditTemplate() {
    const shopify = useAppBridge();
    const app = useAppBridge();
    const fetch = app.fetch || window.fetch;
    const navigate = useNavigate();
    const { id } = useParams(); // Extracts the template ID from the route path parameter

    // Page Rendering 
    const [pageLoading, setPageLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');

    // UI Feedback State
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [errorBanner, setErrorBanner] = useState(null);
    const [originalTemplate, setOriginalTemplate] = useState(null);
    const [design, setDesign] = useState({});


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

    const PAPER_TEMPLATES = {
        dymo: {
            "30334": {
                name: "Jewelry Label",

                paper: {
                    width: 54,
                    height: 25
                },

                label: {
                    width: 54,
                    height: 25
                },

                rows: 1,
                columns: 1,

                gapX: 0,
                gapY: 0,

                marginTop: 0,
                marginLeft: 0
            },

            "30252": {
                name: "Address Label",

                paper: {
                    width: 89,
                    height: 36
                },

                label: {
                    width: 89,
                    height: 36
                },

                rows: 1,
                columns: 1,

                gapX: 0,
                gapY: 0,

                marginTop: 0,
                marginLeft: 0
            }
        },

        zebra: {
            "4000d-4x6": {
                name: "Shipping Label",

                paper: {
                    width: 101.6,
                    height: 152.4
                },

                label: {
                    width: 101.6,
                    height: 152.4
                },

                rows: 1,
                columns: 1,

                gapX: 0,
                gapY: 0
            },
            "4000d-2x1": {
                name: "Small Label",

                paper: {
                    width: 50.8,
                    height: 25.4
                },

                label: {
                    width: 50.8,
                    height: 25.4
                },

                rows: 1,
                columns: 1,

                gapX: 0,
                gapY: 0
            }
        },

        avery: {
            "5160": {
                name: "Address",

                paper: {
                    width: 215.9,
                    height: 279.4
                },

                label: {
                    width: 66.7,
                    height: 25.4
                },

                rows: 10,
                columns: 3,

                gapX: 3.2,
                gapY: 0,

                marginTop: 12.7,
                marginLeft: 4.8
            }
        }
    };

    // Load existing values from backend database on mount
    useEffect(() => {
        async function fetchTemplateData() {
            try { 
                setPageLoading(true);
                const response = await fetch(`/api/templates/${id}`);
                const result = await response.json();

                if (response.ok && result.success) {
                    const t = result.data;

                    setOriginalTemplate(t);

                    setName(t.template_name || "");
                    setDescription(t.description || "");
                    setNote(t.note || "");
                    setBrand(t.paper_brand || "");
                    setModel(t.paper_model || "");

                    setIsDirty(false);
                } else {
                    setErrorBanner(result.message || "Failed to load template profile details.");
                }
            } catch (err) {
                setErrorBanner("Could not establish communication with the server channel.");
            } finally {
                setPageLoading(false);
            }
        }
        fetchTemplateData();
    }, [id, fetch]);

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

    const handleDiscard = () => {
        if (!originalTemplate) return;

        setName(originalTemplate.template_name || "");
        setDescription(originalTemplate.description || "");
        setNote(originalTemplate.note || "");
        setBrand(originalTemplate.paper_brand || "");
        setModel(originalTemplate.paper_model || "");

        setIsDirty(false);
        setErrorBanner(null);
    };

    // Form Update Submission Handler
    const handleSubmit = useCallback(async () => {
        if (!name) {
            setErrorBanner('Template Name is required.');
            return;
        }

        setLoading(true);
        setErrorBanner(null);

        try {
            const response = await fetch(`/api/templates/${id}`, {
                method: 'PUT',
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

            await fetch(`/api/templates/design/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(design),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setToastMessage('Template updated successfully!');
                setToastActive(true);
                setIsDirty(false);

                //Redirect to template list
                setTimeout(() => {
                    navigate('/TemplateList');
                }, 1500);
            } else {
                setErrorBanner(result.message || 'Failed to update template.');
            }
        } catch (error) {
            setErrorBanner('A server error occurred while executing the update.');
        } finally {
            setLoading(false);
        }
    }, [id, name, description, note, brand, model, design, fetch, navigate]);

    if (pageLoading) {
        return (
            <Box padding="1200" align="center">
                <Spinner accessibilityLabel="Syncing template profile details" size="large" />
            </Box>
        );
    }

    return (
        <Frame>
            <SaveBar id="edit-template-savebar" open={isDirty}>
                <button
                    variant="primary"
                    loading={loading ? "true" : undefined}
                    onClick={handleSubmit}
                >
                    Save
                </button>

                <button onClick={handleDiscard}>
                    Discard
                </button>
            </SaveBar>

            <Page
                title={`Edit Template: ${name}`}
                backAction={{ content: 'Templates', url: '/TemplateList' }}
            >
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
                            <Box paddingBlockStart="600">
                                <DesignCanvasEdit
                                    templateId={id}
                                    onChange={setDesign}
                                    onDirty={() => setIsDirty(true)}
                                />
                            </Box>
                        </Card>
                    </Layout.Section>
                </Layout>
                {toastActive && <Toast content={toastMessage} onDismiss={() => setToastActive(false)} />}
            </Page>
        </Frame>
    );
}
