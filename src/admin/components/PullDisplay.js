/**
 * Composant pour afficher une cagnotte
 */

import React from 'react';
import { Box, Text } from '@adminjs/design-system';

const PullDisplay = ({ record }) => {
  if (!record || !record.params) {
    return React.createElement(Text, { key: "no-data" }, 'N/A');
  }

  const pullTitle = record.params.pull?.title || record.params.title || 'Cagnotte inconnue';
  const pullId = record.params.pullId || record.params.id;

  return React.createElement(Box, { key: "pull" }, [
    React.createElement(Text, {
      variant: "sm",
      key: "title",
      style: { fontWeight: 'bold' }
    }, pullTitle),
    React.createElement(Text, {
      variant: "xs",
      color: "grey60",
      key: "id"
    }, `ID: ${pullId}`)
  ]);
};

export default PullDisplay;