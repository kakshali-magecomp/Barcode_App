import React, { useEffect, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Spinner,
} from "@shopify/polaris";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useAppBridge } from "@shopify/app-bridge-react";

import Barcode from "./barcode";
import SKU from "./sku";
import Printing from "./printing";
import Stocky from "./stocky";
import Translation from "./translation";
import ApiAccess from "./apiAccess";

export default function SettingsLayout() {
  const shopify = useAppBridge();

  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    barcode_type: "CODE128",
    show_human_text: true,

    auto_generate_sku: false,
    sku_prefix: "",

    paper_size: "A4",
    paper_orientation: "portrait",
    margin_top: 5,
    margin_left: 5,

    sync_stocky: false,

    language: "en",

    api_key: "",
  });

  const menuItems = [
    {
      key: "barcode",
      label: "Barcode",
      path: "/Settings/barcode",
    },
    {
      key: "sku",
      label: "SKU",
      path: "/Settings/sku",
    },
    {
      key: "printing",
      label: "Printing",
      path: "/Settings/printing",
    },
    {
      key: "stocky",
      label: "Stocky",
      path: "/Settings/stocky",
    },
    {
      key: "translation",
      label: "Translation",
      path: "/Settings/translation",
    },
    {
      key: "api",
      label: "API Access",
      path: "/Settings/api",
    },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/app-settings");

      const result = await response.json();

      if (result.success) {
        setSettings(result.data);
      }
    } catch (err) {
      console.error(err);

      shopify.toast.show("Failed to load settings", {
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/app-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      shopify.toast.show("Settings Saved");
    } catch (err) {
      console.error(err);

      shopify.toast.show("Unable to save settings", {
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page title="Settings">
        <div
          style={{
            padding: 60,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Settings"
      primaryAction={{
        content: "Save Settings",
        loading: saving,
        onAction: saveSettings,
      }}
    >
      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <div style={{ padding: 12 }}>
              <BlockStack gap="200">
                {menuItems.map((item) => (
                  <Button
                    key={item.key}
                    fullWidth
                    alignment="start"
                    pressed={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                  >
                    {item.label}
                  </Button>
                ))}
              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: 20 }}>
              <Routes>
                <Route
                  index
                  element={
                    <Navigate
                      to="/Settings/barcode"
                      replace
                    />
                  }
                />

                <Route
                  path="barcode"
                  element={
                    <Barcode
                      settings={settings}
                      updateSetting={updateSetting}
                    />
                  }
                />

                <Route
                  path="sku"
                  element={
                    <SKU
                      settings={settings}
                      updateSetting={updateSetting}
                    />
                  }
                />

                <Route
                  path="printing"
                  element={
                    <Printing
                      settings={settings}
                      updateSetting={updateSetting}
                    />
                  }
                />

                <Route
                  path="stocky"
                  element={
                    <Stocky
                      settings={settings}
                      updateSetting={updateSetting}
                    />
                  }
                />

                <Route
                  path="translation"
                  element={
                    <Translation
                      settings={settings}
                      updateSetting={updateSetting}
                    />
                  }
                />

                <Route
                  path="api"
                  element={
                    <ApiAccess
                      settings={settings}
                      updateSetting={updateSetting}
                    />
                  }
                />
              </Routes>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}