/**
 * Composant pour le rejet KYC avec raison
 */

import React, { useState } from 'react';
import { Button, Box, Text, TextArea, Label } from '@adminjs/design-system';

const KycRejection = ({ record, resource, action }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReject = async () => {
    if (!reason.trim()) {
      setMessage('Veuillez saisir une raison de rejet');
      return;
    }

    setLoading(true);
    try {
      // Ici on pourrait implémenter la logique de rejet
      // Pour l'instant, on simule seulement
      setMessage('Demande KYC rejetée');
    } catch (error) {
      setMessage('Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(Box, { p: "md" }, [
    React.createElement(Text, { variant: "lg", mb: "md", key: "title" }, `Rejet KYC: ${record.params.user?.name || 'Utilisateur'}`),

    React.createElement(Box, { mb: "md", key: "reason-box" }, [
      React.createElement(Label, { htmlFor: "reason", key: "reason-label" }, "Raison du rejet"),
      React.createElement(TextArea, {
        id: "reason",
        value: reason,
        onChange: (e) => setReason(e.target.value),
        placeholder: "Expliquez pourquoi cette vérification KYC est rejetée...",
        rows: 4,
        key: "reason-textarea"
      })
    ]),

    React.createElement(Button, {
      variant: "contained",
      color: "error",
      onClick: handleReject,
      disabled: loading || !reason.trim(),
      key: "reject-button"
    }, "Rejeter la vérification"),

    message && React.createElement(Box, { mt: "md", key: "message" }, [
      React.createElement(Text, {
        variant: "sm",
        color: message.includes('Erreur') ? 'error' : 'success',
        key: "message-text"
      }, message)
    ])
  ]);
};

export default KycRejection;
