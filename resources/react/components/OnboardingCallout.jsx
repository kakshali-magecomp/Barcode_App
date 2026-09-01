import React from 'react';
import { Card, BlockStack, Text, InlineStack, Button } from '@shopify/polaris';

export default function OnboardingCallout({
    scheduleLink = "https://calendly.com/krishamin-magecomp/30min",
    contactLink = "mailto:support@magecomp.com"
}) {
    return (
        <Card>
            <BlockStack gap="300">
                <Text as="h3" variant="headingMd" fontWeight="bold">
                    Schedule 1-1 onboarding call with experts
                </Text>
                <Text as="p" tone="subdued">
                    Set your app launched faster and smoother with our experts guidance on best practices, setup, and launch.
                </Text>
                <InlineStack gap="300">
                    <Button variant="primary" url={scheduleLink} target="_blank">
                        Schedule Now
                    </Button>
                    <Button url={contactLink} target="_blank">
                        Contact Us
                    </Button>
                </InlineStack>
            </BlockStack>
        </Card>
    );
}
