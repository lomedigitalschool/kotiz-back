import React from 'react';
import { Box, H1, Text, Button } from '@adminjs/design-system';

const Export = () => {
  const handleExport = (type) => {
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/api/v1/admin/export/contributions/${type}`, '_blank');
  };

  return (
    <Box p="xl">
      <H1>📤 Export des Données</H1>
      <Text mt="lg" mb="xl">
        Exportez les données de votre plateforme au format CSV ou Excel.
      </Text>

      <Box display="flex" gap="md" flexWrap="wrap">
        <Button variant="primary" onClick={() => handleExport('csv')}>
          📊 Export CSV - Contributions
        </Button>
        <Button variant="secondary" onClick={() => handleExport('excel')}>
          📈 Export Excel - Contributions
        </Button>
        <Button variant="success" onClick={() => handleExport('pdf')}>
          📄 Export PDF - Contributions
        </Button>
      </Box>
    </Box>
  );
};

export default Export;