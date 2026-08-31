# Barcode & QR Code Label Generator App for Shopify

## Project Overview

This project is a complete **Shopify Application** built using **Laravel** for the backend and **React** for the frontend. Its primary purpose is to allow Shopify merchants to generate, design, customize, and print barcode and QR code labels for their products.

## Tech Stack

### Backend (Laravel 11.x, PHP 8.2)
- **Shopify Integration**: Uses the `kyon147/laravel-shopify` package to authenticate and interact with the Shopify API.
- **PDF Generation**: Uses `barryvdh/laravel-dompdf` for rendering designed labels into PDF sheets for printing.
- **Barcode/QR Libraries**: `picqer/php-barcode-generator` for rendering traditional barcodes (CODE128, UPCA, EAN13, etc.) and `simplesoftwareio/simple-qrcode` for rendering QR codes.

### Frontend (React 18.x, Vite)
- **Shopify Polaris**: Uses `@shopify/polaris` and `@shopify/app-bridge-react` to maintain a consistent UI and seamless experience inside the Shopify Admin.
- **Barcode Rendering**: `react-barcode`, `react-qr-code`, `jsbarcode`, `qrcode` for previewing barcodes dynamically on the client side.
- **Routing**: `react-router-dom` handles navigation for the app's single-page architecture.

---

## Core Functionality & Features

### 1. Template Management & Design Canvas
Users can create customized label templates that determine how printed labels will look. 
- **Interactive Design**: The frontend includes a `DesignCanvas` where merchants can toggle fields like SKU, Product Title, Variant Options, Price, Vendor, and the Symbol (Barcode/QR code itself).
- **Formatting**: Allows customizing settings such as symbol type (QR/Barcode), format (e.g., EAN13, CODE128), symbol colors, size, currency formats, decimal places, and label margins.
- **Dynamic Previews**: As users tweak settings, the React components (`BarcodeRenderer`, `QrCodeRenderer`, `TemplateLabelRenderer`) visually update the label preview in real-time.

### 2. Barcode & SKU Management
The app provides robust settings to handle how barcodes and SKUs are assigned.
- **Barcode Settings**: Merchants can configure their preferred barcode formats and whether the barcode represents the SKU, product title, price, online URL, or a custom value.
- **SKU Settings**: Provides auto-generation capabilities for SKUs to help users quickly manage inventory cataloging.
- **Bulk Operations**: Bulk update products to assign or generate missing SKUs and Barcodes via Shopify APIs.

### 3. Print Settings & Label History
- **PDF Printing**: Through the `BarcodePrintController`, when a user selects a product and a template, the app parses the design settings, calculates checksums (for formats like UPCA), renders the symbols as Base64/SVG elements, and constructs an HTML markup. This is passed to DOMPDF to produce a downloadable, ready-to-print PDF file containing multiple stickers based on the requested quantity.
- **History Tracking**: The app logs every generated label in `LabelHistory` and `PrintHistory` so merchants can track when labels were printed, in what quantities, and by whom.

### 4. Billing & Subscriptions
The backend includes a `PlanController` and related subscription logic, indicating the app supports different pricing tiers for its users.

### 5. Webhooks & Background Tasks
Includes webhooks (like `ProductWebhookController` for handling product creations) to keep the app's internal database or operations synchronized with events happening natively inside the merchant's Shopify store.

---

## Database Architecture (Key Models)

- **`User`**: Represents the authenticated Shopify store (via `kyon147/laravel-shopify`).
- **`BarcodeTemplate` & `TemplateDesign`**: Stores the metadata and the JSON configuration for the label designs.
- **`BarcodeSetting` & `SkuSetting`**: Holds the store's global configuration for SKU/Barcode generation and formats.
- **`PrintSetting`**: Global settings tailored to physical printer margins and configurations.
- **`LabelHistory`, `PrintHistory`, `PrintHistoryItem`**: Logs and audit trails for generated and printed labels.
- **`BulkOperation`**: Tracks asynchronous background jobs (like updating 10,000 product SKUs).

---

## Frontend Routing Structure
Located in `resources/react/route.jsx`:
- `/` -> **Dashboard**: Application overview and stats.
- `/TemplateList` / `/TamplateCreate` / `/templates/edit/:id` / `/templates/design/:id`: **Template CRUD and Designer**.
- `/ProductsList` / `/ProductsBarcodeList`: **Product Management** for selecting which items to print labels for.
- `/BarcodeSkuPanel` / `/SkuSettingsIndex` / `/Settingindex`: **App Settings**.
- `/LabelHistory`: **Activity Logs**.
- `/Plan`: **Subscription management**.
