/**
 * Composant pour afficher un contributeur
 */

import React from 'react';
import { Box, Text } from '@adminjs/design-system';

const ContributorDisplay = ({ record }) => {
  if (!record || !record.params) {
    return React.createElement(Text, { key: "no-data" }, 'N/A');
  }

  const contributorName = record.params.anonymous ? 'Contributeur anonyme' :
                         record.params.user?.name || record.params.user?.email ||
                         `Utilisateur #${record.params.userId}`;
  const contributorEmail = record.params.contributorEmail || record.params.user?.email || '';

  return React.createElement(Box, { key: "contributor" }, [
    React.createElement(Text, {
      variant: "sm",
      key: "name",
      style: { fontWeight: 'bold' }
    }, contributorName),
    contributorEmail && contributorEmail !== contributorName && React.createElement(Text, {
      variant: "xs",
      color: "grey60",
      key: "email"
    }, contributorEmail)
  ]);
};

export default ContributorDisplay;