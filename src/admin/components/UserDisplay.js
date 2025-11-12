/**
 * Composant pour afficher un utilisateur
 */

import React from 'react';
import { Box, Text } from '@adminjs/design-system';

const UserDisplay = ({ record }) => {
  if (!record || !record.params) {
    return React.createElement(Text, { key: "no-data" }, 'N/A');
  }

  const userName = record.params.user?.name || record.params.name || record.params.user?.email || record.params.email || 'Utilisateur inconnu';
  const userEmail = record.params.user?.email || record.params.email || '';

  return React.createElement(Box, { key: "user" }, [
    React.createElement(Text, {
      variant: "sm",
      key: "name",
      style: { fontWeight: 'bold' }
    }, userName),
    userEmail && userEmail !== userName && React.createElement(Text, {
      variant: "xs",
      color: "grey60",
      key: "email"
    }, userEmail)
  ]);
};

export default UserDisplay;