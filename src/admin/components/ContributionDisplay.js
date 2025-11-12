/**
 * Composant pour afficher une contribution
 */

import React from 'react';
import { Box, Text } from '@adminjs/design-system';

const ContributionDisplay = ({ record }) => {
  if (!record || !record.params) {
    return React.createElement(Text, { key: "no-data" }, 'N/A');
  }

  const amount = record.params.contribution?.amount || record.params.amount || 0;
  const contributionId = record.params.contributionId || record.params.id;

  return React.createElement(Box, { key: "contribution" }, [
    React.createElement(Text, {
      variant: "sm",
      key: "amount",
      style: { fontWeight: 'bold' }
    }, `${amount.toLocaleString()} F CFA`),
    React.createElement(Text, {
      variant: "xs",
      color: "grey60",
      key: "id"
    }, `ID: ${contributionId}`)
  ]);
};

export default ContributionDisplay;