import React, { useEffect, useState } from "react";

const PROMO_IMG = "/images/mobile_app_promoV1.png";

const Promoblock = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessionStatus = async () => {
            try {
                const response = await fetch('/api/getpromptdata');
                const data = await response.json();
                setIsVisible(data.promo === 0);
            } catch (error) {
                console.error("Error fetching promo status:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSessionStatus();
    }, []);

    const handleClose = async () => {
        setIsVisible(false);
        try {
            const response = await fetch('/api/closepromo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ closedAt: new Date().toISOString() }),
            });
            if (!response.ok) throw new Error('Failed to close promo');
        } catch (error) {
            console.error('Error closing promo card:', error);
        }
    };

    if (loading || !isVisible) return null;

    return (
        <div
            style={{
                background: '#ffffff',
                border: '1px solid #e1e3e5',
                borderRadius: '16px',
                padding: '20px 24px',
                position: 'relative',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                marginBottom: '16px',
            }}
        >
            {/* Close / Cancel Button */}
            <button
                onClick={handleClose}
                aria-label="Close promotion"
                style={{
                    position: 'absolute',
                    top: '18px',
                    right: '20px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    color: '#6d7175',
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s ease',
                    zIndex: 10,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a1a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6d7175')}
            >
                ✕
            </button>

            {/* Header Title with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingRight: '40px' }}>
                <img
                    src="/images/magecompmobileappimg.png"
                    alt="MageComp"
                    style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0, borderRadius: '6px' }}
                />
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                    Your customers are on mobile. Are they coming back?
                </span>
            </div>

            {/* Inner Content Card */}
            <div
                style={{
                    border: '1px solid #e1e3e5',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    flexWrap: 'wrap',
                }}
            >
                {/* Left Promo Image */}
                <div style={{ flex: '0 0 320px', maxWidth: '100%', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    <img
                        src={PROMO_IMG}
                        alt="MageComp Mobile App Builder"
                        style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', borderRadius: '8px' }}
                    />
                </div>

                {/* Right Text & CTA */}
                <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <s-text tone="subdued" fontSize="medium">
                        Bring shoppers back with your own branded mobile app and push notifications.
                    </s-text>

                    <div>
                        <s-button
                            href="https://apps.shopify.com/mobile-app-builder-by-magecomp"
                            target="_blank"
                            variant="primary"
                            icon="mobile"
                        >
                            Get My Mobile App
                        </s-button>
                    </div>

                    {/* Pill Badges */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[
                            'Push Notifications',
                            'Android & iOS',
                            'No Coding'
                        ].map((feature) => (
                            <div
                                key={feature}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 16px',
                                    borderRadius: '999px',
                                    border: '1px solid #4b5563',
                                    background: '#ffffff',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#1f2937',
                                }}
                            >
                                <span style={{ color: '#1f2937', fontWeight: 600 }}>✓</span>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Promoblock;
