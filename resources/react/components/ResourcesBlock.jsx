import React from "react";
import { Card, BlockStack, Text, Icon } from "@shopify/polaris";
import { NoteIcon, EmailIcon, ChatIcon, QuestionCircleIcon, ChevronRightIcon } from "@shopify/polaris-icons";

const RESOURCE_LINKS = {
    guideline: "#",
    email: "mailto:support@magecomp.com",
    whatsapp: "https://wa.me/917990250277",
    support: "https://helpdesk.magecomp.com/submit-ticket?platform=shopify",
};

const RESOURCE_ITEMS = [
    { label: "App guideline", desc: "Setup and usage docs", icon: NoteIcon, href: RESOURCE_LINKS.guideline },
    { label: "Contact email", desc: "Reach our team directly", icon: EmailIcon, href: RESOURCE_LINKS.email },
    { label: "WhatsApp", desc: "Chat with support", icon: ChatIcon, href: RESOURCE_LINKS.whatsapp },
    { label: "Developer support", desc: "Technical help & bugs", icon: QuestionCircleIcon, href: RESOURCE_LINKS.support },
];

export default function ResourcesBlock() {
    const handleEnter = (e) => {
        e.currentTarget.style.borderColor = "#008ba8";
        e.currentTarget.style.background = "#f2fbfc";
    };

    const handleLeave = (e) => {
        e.currentTarget.style.borderColor = "#e3e6e8";
        e.currentTarget.style.background = "#fafbfb";
    };

    return (
        <Card>
            <BlockStack gap="300">
                <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">Resources</Text>
                    <Text as="p" tone="subdued">Guides and support, whenever you need them.</Text>
                </BlockStack>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                    }}
                >
                    {RESOURCE_ITEMS.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseEnter={handleEnter}
                            onMouseLeave={handleLeave}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid #e3e6e8",
                                background: "#fafbfb",
                                textDecoration: "none",
                                color: "inherit",
                                fontFamily: "inherit",
                            }}
                        >
                            <div
                                style={{
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: "9px",
                                    background: "linear-gradient(135deg, #01161d 0%, #008ba8 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{ width: "16px", color: "#ffffff" }}>
                                    <Icon source={item.icon} tone="inherit" />
                                </div>
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Text as="span" variant="bodySm" fontWeight="semibold">
                                    {item.label}
                                </Text>
                                <div>
                                    <Text as="span" variant="bodyXs" tone="subdued">
                                        {item.desc}
                                    </Text>
                                </div>
                            </div>

                            <div style={{ width: "14px", color: "#8a8f93", flexShrink: 0 }}>
                                <Icon source={ChevronRightIcon} tone="inherit" />
                            </div>
                        </a>
                    ))}
                </div>
            </BlockStack>
        </Card>
    );
}