import React, { useState, useCallback, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useParams, useNavigate } from 'react-router-dom';
import DesignCanvasEdit from '../../components/DesignCanvasEdit.jsx';
import PaperTemplateSettings, {
    PAPER_TEMPLATES,
} from "../../components/PaperTemplateSettings";
const SAVE_BAR_ID = 'edit-template-savebar';

export default function EditTemplate() {

    const shopify = useAppBridge();
    const navigate = useNavigate();
    const { id } = useParams();

    const [pageLoading, setPageLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');

    const [errorBanner, setErrorBanner] = useState(null);
    const [originalTemplate, setOriginalTemplate] = useState(null);
    const [design, setDesign] = useState({});
    const [discardSignal, setDiscardSignal] = useState(0);

    // const brandOptions = [
    //     { label: 'Dymo', value: 'dymo' },
    //     { label: 'Zebra', value: 'zebra' },
    //     { label: 'Avery', value: 'avery' }
    // ];

    // const modelOptionsMap = {
    //     '': [],
    //     'dymo': [
    //         { label: '30334 (Jewelry Label)', value: '30334' },
    //         { label: '30252 (Address Label)', value: '30252' }
    //     ],
    //     'zebra': [
    //         { label: 'Z-Select 4000D (2" x 1")', value: '4000d-2x1' },
    //         { label: 'Z-Select 4000D (4" x 6")', value: '4000d-4x6' }
    //     ],
    //     'avery': [
    //         { label: '5160 (Address 30-per-sheet)', value: '5160' },
    //         { label: '5167 (Return Address)', value: '5167' }
    //     ]
    // };

    // const PAPER_TEMPLATES = {
    //     dymo: {
    //         "30334": { name: "Jewelry Label", paper: { width: 54, height: 25 }, label: { width: 54, height: 25 }, rows: 1, columns: 1, gapX: 0, gapY: 0, marginTop: 0, marginLeft: 0 },
    //         "30252": { name: "Address Label", paper: { width: 89, height: 36 }, label: { width: 89, height: 36 }, rows: 1, columns: 1, gapX: 0, gapY: 0, marginTop: 0, marginLeft: 0 }
    //     },
    //     zebra: {
    //         "4000d-4x6": { name: "Shipping Label", paper: { width: 101.6, height: 152.4 }, label: { width: 101.6, height: 152.4 }, rows: 1, columns: 1, gapX: 0, gapY: 0 },
    //         "4000d-2x1": { name: "Small Label", paper: { width: 50.8, height: 25.4 }, label: { width: 50.8, height: 25.4 }, rows: 1, columns: 1, gapX: 0, gapY: 0 }
    //     },
    //     avery: {
    //         "5160": { name: "Address", paper: { width: 215.9, height: 279.4 }, label: { width: 66.7, height: 25.4 }, rows: 10, columns: 3, gapX: 3.2, gapY: 0, marginTop: 12.7, marginLeft: 4.8 },
    //         "5167": { name: "ReturnAddress", paper: { width: 215.9, height: 279.4 }, label: { width: 66.7, height: 279.6 }, rows: 10, columns: 3, gapx: 3.2, gapy: 0, marginTop: 12.7, marginLeft: 4.8 }
    //     }
    // };


    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show(SAVE_BAR_ID);
        } else {
            shopify.saveBar.hide(SAVE_BAR_ID);
        }
    }, [isDirty, shopify]);

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
    }, [id]);

    const handleFieldChange = (setter) => (event) => {
        setter(event.currentTarget.value);
        setIsDirty(true);
    };

    const handleBrandChange = (event) => {
        setBrand(event.currentTarget.value);
        setModel(''); // Reset model selection when brand shifts
        setIsDirty(true);
    };

    const handleDesignChange = (updatedDesign) => {
        setDesign(updatedDesign);
        setIsDirty(true);
    };

    const handleDiscard = () => {
        if (!originalTemplate) return;

        setName(originalTemplate.template_name || "");
        setDescription(originalTemplate.description || "");
        setNote(originalTemplate.note || "");
        setBrand(originalTemplate.paper_brand || "");
        setModel(originalTemplate.paper_model || "");

        setDiscardSignal(prev => prev + 1); // tell child to reload

        setIsDirty(false);
        setErrorBanner(null);
    };

    const handleSubmit = useCallback(async () => {
        if (!name) {
            setErrorBanner('Template Name is required.');
            return;
        }

        setLoading(true);
        setErrorBanner(null);

        try {
            const selectedPaperTemplate = PAPER_TEMPLATES?.[brand]?.[model] || {};
            const response = await fetch(`/api/templates/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_name: name,
                    description: description,
                    note: note,
                    paper_brand: brand,
                    paper_model: model,
                    layout_settings: selectedPaperTemplate,
                }),
            });

            if (Object.keys(design).length > 0) {
                await fetch(`/api/templates/design/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(design),
                });
            }

            const result = await response.json();

            if (response.ok && result.success) {
                shopify.toast.show('Template updated successfully!');
                setIsDirty(false);

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
    }, [id, name, description, note, brand, model, design, navigate, shopify]);

    if (pageLoading) {
        return (
            <s-page heading="Edit Template">
                <s-box padding="loose" alignContent="center">
                    <s-spinner accessibilityLabel="Syncing template profile details" size="large" />
                </s-box>
            </s-page>
        );
    }

    return (
        <>
            <ui-save-bar id={SAVE_BAR_ID}>
                <button variant="primary" loading={loading ? "" : undefined} onClick={handleSubmit}>
                    Save
                </button>
                <button onClick={handleDiscard}>Discard</button>
            </ui-save-bar>

            <s-page heading={`Edit Template: ${name}`}>
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
                        <div style={{ paddingRight: "340px" }}>
                            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                                <s-text-field
                                    label="Template Name"
                                    value={name}
                                    onInput={handleFieldChange(setName)}
                                />
                                <s-text-area
                                    label="Internal Note"
                                    value={note}
                                    onInput={handleFieldChange(setNote)}
                                    rows={2}
                                />
                            </s-grid>
                            <s-text-area
                                label="Description"
                                value={description}
                                onInput={handleFieldChange(setDescription)}
                                rows={3}
                            />

                            <PaperTemplateSettings
                                brand={brand}
                                model={model}
                                onBrandChange={(value) => {
                                    setBrand(value);
                                    setIsDirty(true);
                                }}
                                onModelChange={(value) => {
                                    setModel(value);
                                    setIsDirty(true);
                                }}
                            />

                        </div>
                    </s-stack>

                    <s-box paddingBlockStart="loose">
                        <DesignCanvasEdit
                            templateId={id}
                            discardSignal={discardSignal}
                            onChange={handleDesignChange}
                            onDirty={() => { }}
                            paperTemplate={PAPER_TEMPLATES?.[brand]?.[model] || null}
                        />
                    </s-box>
                </s-section>
            </s-page>
        </>
    );
}