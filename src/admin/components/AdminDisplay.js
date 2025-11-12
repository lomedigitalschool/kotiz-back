/**
 * Composant pour afficher un administrateur
 */

import React from 'react';
import { Box, Text } from '@adminjs/design-system';

const AdminDisplay = ({ record }) => {
  if (!record || !record.params) {
    return React.createElement(Text, { key: "no-data" }, 'N/A');
  }

  const adminName = record.params.user?.name || record.params.name || 'Administrateur système';
  const adminEmail = record.params.user?.email || record.params.email || '';

  return React.createElement(Box, { key: "admin" }, [
    React.createElement(Text, {
      variant: "sm",
      key: "name",
      style: { fontWeight: 'bold' }
    }, adminName),
    adminEmail && React.createElement(Text, {
      variant: "xs",
      color: "grey60",
      key: "email"
    }, adminEmail)
  ]);
};

export default AdminDisplay;