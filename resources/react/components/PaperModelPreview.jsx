import React from 'react';

export default function PaperModelPreview({ brand, model, paper }) {
    if (!paper || !paper.paper || !paper.label) {
        return (
            <s-box padding="base" borderWidth="base" borderRadius="base">
                <s-stack direction="block" gap="small" alignItems="center">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#616161' }}>
                        No Paper Template Selected
                    </span>
                    <span style={{ fontSize: '12px', color: '#8c8c8c', textAlign: 'center' }}>
                        Select a paper brand and model to preview the layout.
                    </span>
                </s-stack>
            </s-box>
        );
    }

    const isRoll = paper.type === 'roll';
    const paperWidth = Number(paper.paper.width) || 100;
    const paperHeight = Number(paper.paper.height) || 100;
    const labelWidth = Number(paper.label.width) || 50;
    const labelHeight = Number(paper.label.height) || 30;

    const rows = Math.max(1, Number(paper.rows) || 1);
    const columns = Math.max(1, Number(paper.columns) || 1);
    const totalLabels = rows * columns;

    const brandDisplay = brand
        ? brand.charAt(0).toUpperCase() + brand.slice(1)
        : 'Custom';
    const modelDisplay = paper.name || model || 'Custom Size';

    // Calculate aspect ratio for visual preview box
    const maxPreviewHeight = 150;
    const maxPreviewWidth = 240;
    
    let containerWidth = maxPreviewWidth;
    let containerHeight = maxPreviewHeight;

    if (!isRoll && paperWidth > 0 && paperHeight > 0) {
        const ratio = paperWidth / paperHeight;
        if (ratio > maxPreviewWidth / maxPreviewHeight) {
            containerWidth = maxPreviewWidth;
            containerHeight = maxPreviewWidth / ratio;
        } else {
            containerHeight = maxPreviewHeight;
            containerWidth = maxPreviewHeight * ratio;
        }
        // Keep bounds
        containerWidth = Math.max(100, Math.min(maxPreviewWidth, containerWidth));
        containerHeight = Math.max(80, Math.min(maxPreviewHeight, containerHeight));
    }

    return (
        <div
            style={{
                background: '#ffffff',
                border: '1px solid #e1e3e5',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                padding: '14px',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            <s-stack direction="block" gap="small">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#303030' }}>
                            Paper Layout Preview
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: isRoll ? '#e4e8f7' : '#e3f1df',
                            color: isRoll ? '#2c6ecb' : '#008060',
                            textTransform: 'uppercase',
                        }}
                    >
                        {isRoll ? 'Roll Feed' : 'Sheet Paper'}
                    </span>
                </div>

                {/* Visual Representation Area */}
                <div
                    style={{
                        background: '#f6f6f7',
                        border: '1px solid #e1e3e5',
                        borderRadius: '8px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '110px',
                    }}
                >
                    {isRoll ? (
                        /* ROLL PREVIEW GRAPHIC */
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            {/* Cylinder Roll Icon */}
                            <div
                                style={{
                                    width: '140px',
                                    height: '28px',
                                    borderRadius: '14px / 6px',
                                    background: 'linear-gradient(180deg, #d2d5d8 0%, #ffffff 50%, #b8bcbf 100%)',
                                    border: '1.5px solid #a4a9ad',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    position: 'relative',
                                }}
                            >
                                <div
                                    style={{
                                        width: '20px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: '#5c5f62',
                                        border: '1px solid #303030',
                                    }}
                                />
                                <span style={{ position: 'absolute', right: '10px', fontSize: '8px', fontWeight: 700, color: '#616161' }}>
                                    ROLL CORE
                                </span>
                            </div>

                            {/* Continuous Label Feed */}
                            <div
                                style={{
                                    width: '115px',
                                    background: '#ffffff',
                                    border: '1px dashed #b8bcbf',
                                    borderTop: 'none',
                                    borderRadius: '0 0 4px 4px',
                                    padding: '6px 4px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 3px 5px -2px rgba(0,0,0,0.05)',
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '32px',
                                        background: '#edf3fe',
                                        border: '1.5px solid #2c6ecb',
                                        borderRadius: '3px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#1c4f9c' }}>
                                        {labelWidth}mm × {labelHeight}mm
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* SHEET PREVIEW GRAPHIC */
                        <div
                            style={{
                                width: `${containerWidth}px`,
                                height: `${containerHeight}px`,
                                background: '#ffffff',
                                border: '1.5px solid #a4a9ad',
                                borderRadius: '4px',
                                boxShadow: '0 3px 6px rgba(0,0,0,0.08)',
                                padding: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-around',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            {/* Render rows and columns grid */}
                            {Array.from({ length: Math.min(rows, 12) }).map((_, rIdx) => (
                                <div
                                    key={rIdx}
                                    style={{
                                        display: 'flex',
                                        gap: '4px',
                                        width: '100%',
                                        height: `${100 / Math.min(rows, 12)}%`,
                                        marginBottom: rIdx < rows - 1 ? '2px' : 0,
                                        alignItems: 'center',
                                    }}
                                >
                                    {Array.from({ length: Math.min(columns, 8) }).map((_, cIdx) => (
                                        <div
                                            key={cIdx}
                                            style={{
                                                flex: 1,
                                                height: '88%',
                                                background: '#edf3fe',
                                                border: '1px solid #2c6ecb',
                                                borderRadius: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {rows * columns <= 6 && (
                                                <span style={{ fontSize: '8px', fontWeight: 600, color: '#1c4f9c' }}>
                                                    {labelWidth}×{labelHeight}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Specs Details List */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isRoll ? '1fr 1fr' : '1fr 1fr 1fr',
                        gap: '6px',
                        fontSize: '11px',
                        background: '#fafafa',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #ebebeb',
                    }}
                >
                    <div>
                        <span style={{ color: '#616161', display: 'block' }}>Paper Size</span>
                        <strong style={{ color: '#303030' }}>
                            {paperWidth} × {paperHeight} mm
                        </strong>
                    </div>

                    <div>
                        <span style={{ color: '#616161', display: 'block' }}>Label Size</span>
                        <strong style={{ color: '#303030' }}>
                            {labelWidth} × {labelHeight} mm
                        </strong>
                    </div>

                    {!isRoll && (
                        <div>
                            <span style={{ color: '#616161', display: 'block' }}>Sheet Grid</span>
                            <strong style={{ color: '#303030' }}>
                                {columns} × {rows} ({totalLabels} total)
                            </strong>
                        </div>
                    )}
                </div>
            </s-stack>
        </div>
    );
}
