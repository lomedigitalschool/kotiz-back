/**
 * Composant pour la modration des cagnottes
 */

import React, { useState } from 'react';
import { Button, Box, Text, TextArea, Label } from '@adminjs/design-system';

const PoolModeration = ({ record, resource, action }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFlag = async () => {
    if (!reason.trim()) {
      setMessage('Veuillez saisir une raison pour le signalement');
      return;
    }

    setLoading(true);
    try {
      // Logique de signalement  implmenter
      setMessage('Cagnotte signale comme suspecte');
    } catch (error) {
      setMessage('Erreur lors du signalement');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(Box, { p: "md" }, [
    React.createElement(Text, { variant: "lg", mb: "md", key: "title" }, `Modration cagnotte: ${record.params.title}`),

    React.createElement(Box, { mb: "md", key: "reason-box" }, [
      React.createElement(Label, { htmlFor: "reason", key: "reason-label" }, "Raison du signalement"),
      React.createElement(TextArea, {
        id: "reason",
        value: reason,
        onChange: (e) => setReason(e.target.value),
        placeholder: "Expliquez pourquoi cette cagnotte est suspecte...",
        rows: 4,
        key: "reason-textarea"
      })
    ]),

    React.createElement(Button, {
      variant: "contained",
      color: "warning",
      onClick: handleFlag,
      disabled: loading || !reason.trim(),
      key: "flag-button"
    }, "Signaler comme suspecte"),

    message && React.createElement(Box, { mt: "md", key: "message" }, [
      React.createElement(Text, {
        variant: "sm",
        color: message.includes('Erreur') ? 'error' : 'success',
        key: "message-text"
      }, message)
    ])
  ]);
};

export default PoolModeration;
