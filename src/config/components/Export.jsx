import React from 'react';
import { Box, H1, Text, Button, H2, Section } from '@adminjs/design-system';

const Export = () => {
  const handleExport = (endpoint, type) => {
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/api/v1/admin/export/${endpoint}/${type}`, '_blank');
  };

  return (
    <Box p="xl">
      <H1>📤 Export des Données</H1>
      <Text mt="lg" mb="xl">
        Exportez les données de votre plateforme au format CSV, Excel ou PDF.
      </Text>

      {/* Export des Contributions */}
      <Section mb="xl">
        <H2>💰 Contributions</H2>
        <Text mt="sm" mb="lg" color="grey60">
          Exportez toutes les contributions avec détails des contributeurs et montants.
        </Text>
        <Box display="flex" gap="md" flexWrap="wrap">
          <Button variant="primary" onClick={() => handleExport('contributions', 'csv')}>
            📊 CSV - Contributions
          </Button>
          <Button variant="secondary" onClick={() => handleExport('contributions', 'excel')}>
            📈 Excel - Contributions
          </Button>
          <Button variant="success" onClick={() => handleExport('contributions', 'pdf')}>
            📄 PDF - Contributions
          </Button>
        </Box>
      </Section>

      {/* Export des Retraits */}
      <Section mb="xl">
        <H2>💸 Retraits</H2>
        <Text mt="sm" mb="lg" color="grey60">
          Exportez les retraits traités avec montants et informations des bénéficiaires.
        </Text>
        <Box display="flex" gap="md" flexWrap="wrap">
          <Button variant="primary" onClick={() => handleExport('retraits', 'csv')}>
            📊 CSV - Retraits
          </Button>
          <Button variant="secondary" onClick={() => handleExport('retraits', 'excel')}>
            📈 Excel - Retraits
          </Button>
          <Button variant="success" onClick={() => handleExport('retraits', 'pdf')}>
            📄 PDF - Retraits
          </Button>
        </Box>
      </Section>

      {/* Export des Utilisateurs */}
      <Section mb="xl">
        <H2>👥 Utilisateurs</H2>
        <Text mt="sm" mb="lg" color="grey60">
          Exportez la liste complète des utilisateurs avec leurs informations.
        </Text>
        <Box display="flex" gap="md" flexWrap="wrap">
          <Button variant="primary" onClick={() => handleExport('users', 'csv')}>
            📊 CSV - Utilisateurs
          </Button>
          <Button variant="secondary" onClick={() => handleExport('users', 'excel')}>
            📈 Excel - Utilisateurs
          </Button>
          <Button variant="success" onClick={() => handleExport('users', 'pdf')}>
            📄 PDF - Utilisateurs
          </Button>
        </Box>
      </Section>

      {/* Export des Transactions */}
      <Section>
        <H2>🔄 Transactions</H2>
        <Text mt="sm" mb="lg" color="grey60">
          Exportez l'historique complet des transactions financières.
        </Text>
        <Box display="flex" gap="md" flexWrap="wrap">
          <Button variant="outlined" onClick={() => {
            const baseUrl = window.location.origin;
            window.open(`${baseUrl}/api/v1/admin/transactions/export`, '_blank');
          }}>
            📊 Export JSON - Transactions
          </Button>
        </Box>
      </Section>
    </Box>
  );
};

export default Export;