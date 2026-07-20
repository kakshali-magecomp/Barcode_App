import {
  Modal,
  IndexTable,
  Text,
  Thumbnail,
  Spinner,
  TextField,
} from "@shopify/polaris";

import React, { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function ProductPickerModal({
  open,
  onClose,
  onSelect,
}) {
  const appBridge = useAppBridge();
  const fetch = appBridge.fetch || window.fetch;
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;

    loadProducts();
  }, [open]);

  async function loadProducts() {
    setLoading(true);

    const res = await fetch("/api/products");
    const json = await res.json();

    if (json.status) {
      setProducts(json.variants);
    }

    setLoading(false);
  }

  const filteredProducts = products.filter((item) =>
    item.product_title
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose Products"
      primaryAction={{
        content: `Select (${selected.length})`,
        onAction: () => {
          onSelect(
            products.filter((p) =>
              selected.includes(p.variant_id)
            )
          );

          onClose();
        },
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
      large
    >
      <Modal.Section>

        <TextField
          label="Search"
          labelHidden
          placeholder="Search products..."
          value={search}
          onChange={setSearch}
          autoComplete="off"
        />

        <br />

        {loading ? (
          <Spinner />
        ) : (
          <IndexTable
            resourceName={{
              singular: "product",
              plural: "products",
            }}
            itemCount={filteredProducts.length}
            selectedItemsCount={selected.length}
            onSelectionChange={(type, checked, id) => {
              if (type === "all") {
                setSelected(
                  checked
                    ? filteredProducts.map(
                      (p) => p.variant_id
                    )
                    : []
                );
              } else {
                setSelected((prev) =>
                  checked
                    ? [...prev, id]
                    : prev.filter((x) => x !== id)
                );
              }
            }}
            headings={[
              { title: "" },
              { title: "Product" },
              { title: "SKU" },
              { title: "Barcode" },
            ]}
          >
            {filteredProducts.map((item, index) => (
              <IndexTable.Row
                id={item.variant_id}
                key={item.variant_id}
                position={index}
                selected={selected.includes(
                  item.variant_id
                )}
              >
                <IndexTable.Cell>
                  <Thumbnail
                    source={item.image}
                    alt=""
                    size="small"
                  />
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <Text fontWeight="bold" as="span">
                    {item.product_title}
                  </Text>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  {item.current_sku || "-"}
                </IndexTable.Cell>

                <IndexTable.Cell>
                  {item.barcode || "-"}
                </IndexTable.Cell>

              </IndexTable.Row>
            ))}
          </IndexTable>
        )}
      </Modal.Section>
    </Modal>
  );
}