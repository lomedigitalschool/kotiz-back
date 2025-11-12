/**
 * Composant pour afficher une méthode de paiement
 */

import React from 'react';
import { Box, Text } from '@adminjs/design-system';

const PaymentMethodDisplay = ({ record }) => {
  if (!record || !record.params) {
    return React.createElement(Text, { key: "no-data" }, 'N/A');
  }

  const methodName = record.params.paymentMethod?.name || record.params.name || 'Méthode inconnue';
  const provider = record.params.paymentMethod?.provider || record.params.provider || '';

  return React.createElement(Box, { key: "method" }, [
    React.createElement(Text, {
      variant: "sm",
      key: "name",
      style: { fontWeight: 'bold' }
    }, methodName),
    provider && React.createElement(Text, {
      variant: "xs",
      color: "grey60",
      key: "provider"
    }, provider)
  ]);
};

export default PaymentMethodDisplay;