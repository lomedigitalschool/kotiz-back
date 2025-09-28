import React from 'react';
import { Box, H1, Text } from '@adminjs/design-system';

const ModerationPanel = () => {
  return (
    <Box p="xl">
      <H1>🛡️ Panel de Modération</H1>
      <Text mt="lg">
        Outils de modération pour gérer les signalements et la sécurité de la plateforme.
      </Text>
      <Text mt="md" color="grey60">
        Fonctionnalité en développement. Utilisez l'interface standard pour gérer les signalements.
      </Text>
    </Box>
  );
};

export default ModerationPanel;