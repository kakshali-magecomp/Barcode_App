import {
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Text,
  Thumbnail
} from "@shopify/polaris";
import React, { useEffect, useState } from "react";
import { XIcon } from "@shopify/polaris-icons";
import promoImage from "../assets/magecompmobileappimg.png";

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
        body: JSON.stringify({
          closedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to close promo');
      }
    } catch (error) {
      console.error('Error closing promo card:', error);
    }
  };

  if (loading || !isVisible) return null;

  return (
    <Card>
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack align="space-between" blockAlign="center" gap={"100"}>
          <Thumbnail size="small" source={promoImage} alt="Promo" />
          <Box paddingInlineStart={200}>
            <Text variant="headingMd" as="h6">
              MageComp - Mobile App Builder
            </Text>
            <Text>
              If you ever think about turning your store into a mobile app, our
              MageComp Mobile App Builder is worth a look.
            </Text>
          </Box>
        </InlineStack>

        <InlineStack align="space-between" blockAlign="center" gap={"100"}>
          <Box>
            <Button
              url="https://apps.shopify.com/mobile-app-builder-by-magecomp"
              target="_blank"
            >
              Try with your store
            </Button>

            <Button
              variant="plain"
              onClick={handleClose}
              icon={<Icon source={XIcon} />}
              accessibilityLabel="Close promotion card"
            />
          </Box>
        </InlineStack>
      </InlineStack>
    </Card>
  );
};

export default Promoblock;
