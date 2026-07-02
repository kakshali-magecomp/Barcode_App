import React from 'react';
import { Modal, Text } from '@shopify/polaris';

export default function DeleteConfirmationModal({ open, loading, title, message, onConfirm, onClose }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title || "Confirm Deletion"}
            primaryAction={{
                content: 'Delete',
                onAction: onConfirm,
                loading: loading,
                destructive: true,
            }}
            secondaryActions={[
                {
                    content: 'Cancel',
                    onAction: onClose,
                },
            ]}
        >
            <Modal.Section>
                <Text as="p">
                    {message || "Are you sure you want to delete this item? This action cannot be undone."}
                </Text>
            </Modal.Section>
        </Modal>
    );
}
