/**
 * Composant pour afficher le créateur d'une cagnotte
 */

import React from 'react';
import { Box, Text } from '@adminjs/design-system';

const CreatorDisplay = ({ record }) => {
  if (!record || !record.params) {
    return React.createElement(Text, { key: "no-data" }, 'N/A');
  }

  const userId = record.params.userId;
  // Essayer d'abord owner (relation définie dans le modèle), puis user
  const userName = record.params.owner?.name || record.params.owner?.email ||
                    record.params.user?.name || record.params.user?.email ||
                    `Utilisateur #${userId}`;

  return React.createElement(Box, { key: "creator" }, [
    React.createElement(Text, {
      variant: "sm",
      key: "name",
      style: { fontWeight: 'bold' }
    }, userName),
    React.createElement(Text, {
      variant: "xs",
      color: "grey60",
      key: "id"
    }, `ID: ${userId}`)
  ]);
};

export default CreatorDisplay;