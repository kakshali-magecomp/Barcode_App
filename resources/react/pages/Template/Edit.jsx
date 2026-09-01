import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppBridge, TitleBar } from '@shopify/app-bridge-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tooltip, Icon } from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';
import DesignCanvasEdit from '../../components/DesignCanvasEdit.jsx';
import PaperTemplateSettings, {
    PAPER_TEMPLATES,
} from '../../components/PaperTemplateSettings';

const SAVE_BAR_ID = 'edit-template-savebar';

const FieldLabel = ({ label, tooltip }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#303030' }}>{label}</span>
        {tooltip && (
            <Tooltip content={tooltip} dismissOnMouseOut>
                <span style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: '#616161' }}>
                    <Icon source={InfoIcon} tone="subdued" />
                </span>
            </Tooltip>
        )}
    </div>
);

export default function EditTemplate() {
    const shopify = useAppBridge();
    const navigate = useNavigate();
    const { id } = useParams();
    const initialStateRef = useRef(null);
    const isDiscardingRef = useRef(false);

    const [pageLoading, setPageLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [customPaper, setCustomPaper] = useState({
        type: 'sheet',
        paper: {
            width: 215.9,
            height: 279.4,
        },
        label: {
            width: 66.7,
            height: 25.4,
        },
        rows: 1,
        columns: 1,
        gapX: 0,
        gapY: 0,
        marginTop: 0,
        marginLeft: 0,
        roll: null,
    });

    const [errorBanner, setErrorBanner] = useState(null);
    const [originalTemplate, setOriginalTemplate] = useState(null);
    const [design, setDesign] = useState({});
    const [discardSignal, setDiscardSignal] = useState(0);

    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show(SAVE_BAR_ID);
        } else {
            shopify.saveBar.hide(SAVE_BAR_ID);
        }
    }, [isDirty, shopify]);

    useEffect(() => {
        let mounted = true;

        async function fetchTemplateData() {
            try {
                setPageLoading(true);

                const response = await fetch(`/api/templates/${id}`);
                const result = await response.json();

                if (!response.ok || !result.success) {
                    setErrorBanner(
                        result.message || 'Failed to load template profile details.'
                    );
                    return;
                }

                const t = result.data;

                if (!mounted) return;

                setOriginalTemplate(t);
                setName(t.template_name || '');
                setDescription(t.description || '');
                setNote(t.note || '');
                setBrand(t.paper_brand || '');
                setModel(t.paper_model || '');

                if (
                    t.paper_brand === 'custom' &&
                    t.layout_settings
                ) {
                    setCustomPaper(t.layout_settings);
                }

                initialStateRef.current = {
                    name: t.template_name || '',
                    description: t.description || '',
                    note: t.note || '',
                    brand: t.paper_brand || '',
                    model: t.paper_model || '',
                    customPaper:
                        t.paper_brand === 'custom' && t.layout_settings
                            ? structuredClone(t.layout_settings)
                            : null,
                    design: null,
                };

                setIsDirty(false);
                shopify.saveBar.hide(SAVE_BAR_ID);
            } catch (err) {
                if (mounted) {
                    setErrorBanner(
                        'Could not establish communication with the server channel.'
                    );
                }
            } finally {
                if (mounted) {
                    setPageLoading(false);
                }
            }
        }

        fetchTemplateData();

        return () => {
            mounted = false;
        };
    }, [id, shopify]);

    useEffect(() => {
        if (!initialStateRef.current || isDiscardingRef.current) {
            return;
        }

        if (initialStateRef.current.design === null) {
            return;
        }

        const current = {
            name,
            description,
            note,
            brand,
            model,
            customPaper: brand === 'custom' ? customPaper : null,
            design,
        };

        const dirty =
            JSON.stringify(current) !==
            JSON.stringify(initialStateRef.current);

        if (!isDiscardingRef.current) {
            setIsDirty(dirty);
        }
    }, [
        name,
        description,
        note,
        brand,
        model,
        customPaper,
        design,
    ]);

    const handleFieldChange = useCallback(
        (setter) => (event) => {
            if (isDiscardingRef.current) return;
            setter(event.currentTarget.value);
        },
        []
    );

    const handleBrandChange = useCallback((value) => {
        if (isDiscardingRef.current) return;

        setBrand(value);

        if (value === 'custom') {
            setModel('custom');
        } else {
            setModel('');
        }
    }, []);

    const handleModelChange = useCallback((value) => {
        if (isDiscardingRef.current) return;
        setModel(value);
    }, []);

    const handleCustomPaperChange = useCallback((value) => {
        if (isDiscardingRef.current) return;
        setCustomPaper(value);
    }, []);

    const handleDesignChange = useCallback(
        (updatedDesign, isInitialLoad = false) => {
            if (isDiscardingRef.current) return;

            setDesign(updatedDesign);

            if (
                isInitialLoad &&
                initialStateRef.current
            ) {
                initialStateRef.current = {
                    ...initialStateRef.current,
                    design: structuredClone(updatedDesign),
                };

                setIsDirty(false);
                shopify.saveBar.hide(SAVE_BAR_ID);
            }
        },
        [shopify]
    );

    const handleDiscard = useCallback(() => {
        if (!initialStateRef.current) return;

        isDiscardingRef.current = true;

        const initial = initialStateRef.current;

        setName(initial.name);
        setDescription(initial.description);
        setNote(initial.note);
        setBrand(initial.brand);
        setModel(initial.model);

        if (initial.customPaper) {
            setCustomPaper(structuredClone(initial.customPaper));
        }

        if (initial.design) {
            setDesign(structuredClone(initial.design));
        }

        setErrorBanner(null);
        setDiscardSignal((prev) => prev + 1);
        setIsDirty(false);
        shopify.saveBar.hide(SAVE_BAR_ID);

        setTimeout(() => {
            isDiscardingRef.current = false;
            setIsDirty(false);
            shopify.saveBar.hide(SAVE_BAR_ID);
        }, 100);
    }, [shopify]);

    const handleSubmit = useCallback(async () => {
        if (loading) return;

        if (!name.trim()) {
            setErrorBanner('Template Name is required.');
            return;
        }

        if (!brand) {
            setErrorBanner('Please select a paper brand.');
            return;
        }

        if (!model) {
            setErrorBanner('Please select a paper model.');
            return;
        }

        const selectedPaperTemplate =
            brand === 'custom'
                ? customPaper
                : PAPER_TEMPLATES?.[brand]?.[model];

        if (!selectedPaperTemplate) {
            setErrorBanner('Invalid paper template selected.');
            return;
        }

        setLoading(true);
        setErrorBanner(null);

        try {
            const response = await fetch(`/api/templates/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    template_name: name,
                    description,
                    note,
                    paper_brand: brand,
                    paper_model: model,
                    layout_settings: selectedPaperTemplate,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Failed to update template.'
                );
            }

            if (Object.keys(design).length > 0) {
                const designResponse = await fetch(
                    `/api/templates/design/${id}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                        body: JSON.stringify(design),
                    }
                );

                const designResult =
                    await designResponse.json().catch(() => null);

                if (
                    !designResponse.ok ||
                    designResult?.success === false
                ) {
                    throw new Error(
                        designResult?.message ||
                        'Template was updated, but the design could not be saved.'
                    );
                }
            }

            initialStateRef.current = {
                name,
                description,
                note,
                brand,
                model,
                customPaper:
                    brand === 'custom'
                        ? structuredClone(customPaper)
                        : null,
                design: structuredClone(design),
            };

            isDiscardingRef.current = true;

            setOriginalTemplate((prev) => ({
                ...prev,
                template_name: name,
                description,
                note,
                paper_brand: brand,
                paper_model: model,
                layout_settings: selectedPaperTemplate,
            }));

            setIsDirty(false);
            shopify.saveBar.hide(SAVE_BAR_ID);
            shopify.toast.show('Template updated successfully!');
            navigate('/TemplateList');
        } catch (error) {
            console.error('Update template error:', error);

            setErrorBanner(
                error.message ||
                'A server error occurred while executing the update.'
            );

            setIsDirty(true);
            shopify.saveBar.show(SAVE_BAR_ID);
        } finally {
            setLoading(false);
        }
    }, [
        id,
        name,
        description,
        note,
        brand,
        model,
        customPaper,
        design,
        loading,
        navigate,
        shopify,
    ]);

    if (pageLoading) {
        return (
            <s-page heading="Edit Template">
                <TitleBar title="barcodedemo-app" />
                <s-box padding="loose" alignContent="center">
                    <s-spinner
                        accessibilityLabel="Syncing template profile details"
                        size="large"
                    />
                </s-box>
            </s-page>
        );
    }

    const selectedPaperTemplate =
        brand === 'custom'
            ? customPaper
            : PAPER_TEMPLATES?.[brand]?.[model] || null;

    return (
        <>
            <ui-save-bar id={SAVE_BAR_ID}>
                <button
                    type="button"
                    variant="primary"
                    disabled={loading}
                    onClick={handleSubmit}
                >
                    {loading ? 'Saving…' : 'Save template'}
                </button>

                <button
                    type="button"
                    disabled={loading}
                    onClick={handleDiscard}
                >
                    Discard
                </button>
            </ui-save-bar>

            <s-page heading={`Edit Template: ${name}`}>
                <TitleBar title="barcodedemo-app" />
                <s-box paddingBlockStart="base">
                    <s-stack
                        direction="inline"
                        gap="small"
                        alignItems="center"
                    >
                        <s-link
                            href="/TemplateList"
                            tone="neutral"
                        >
                            <s-icon type="arrow-left" />
                        </s-link>

                        <span
                            style={{
                                fontSize: '17px',
                                fontWeight: 700,
                            }}
                        >
                            Back to Template List
                        </span>
                    </s-stack>
                </s-box>

                <s-box paddingBlockStart="base" />

                <s-section>
                    {errorBanner && (
                        <s-banner
                            tone="critical"
                            onDismiss={() =>
                                setErrorBanner(null)
                            }
                        >
                            {errorBanner}
                        </s-banner>
                    )}

                    <DesignCanvasEdit
                        templateId={id}
                        discardSignal={discardSignal}
                        onChange={handleDesignChange}
                        onDirty={() => { }}
                        brand={brand}
                        model={model}
                        paperTemplate={selectedPaperTemplate}
                        topFormFields={
                            <>
                                <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                                    <div>
                                        <FieldLabel label="Template Name" tooltip="Enter a name to easily identify this label template." />
                                        <s-text-field
                                            value={name}
                                            onInput={handleFieldChange(setName)}
                                        />
                                    </div>

                                    <div>
                                        <FieldLabel label="Internal Note" tooltip="Add a Short note to help you remember details about this template." />
                                        <s-text-area
                                            value={note}
                                            onInput={handleFieldChange(setNote)}
                                            rows={2}
                                        />
                                    </div>
                                </s-grid>

                                <div>
                                    <FieldLabel label="Description" tooltip="Provide a brief description of the template and how it will be used." />
                                    <s-text-area
                                        value={description}
                                        onInput={handleFieldChange(setDescription)}
                                        rows={3}
                                    />
                                </div>

                                <PaperTemplateSettings
                                    brand={brand}
                                    model={model}
                                    customPaper={customPaper}
                                    onBrandChange={handleBrandChange}
                                    onModelChange={handleModelChange}
                                    onCustomChange={handleCustomPaperChange}
                                />
                            </>
                        }
                    />
                </s-section>
            </s-page>
        </>
    );
}