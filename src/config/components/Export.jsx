import React, { useState } from 'react';
import { Box, H1, H2, Text, Button, Select, FormGroup, Label } from '@adminjs/design-system';

const Export = () => {
  const [exportType, setExportType] = useState({ value: 'users', label: 'Utilisateurs' });
  const [exportFormat, setExportFormat] = useState({ value: 'csv', label: 'CSV' });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const baseUrl = window.location.origin;
      // Extraire les valeurs des objets Select
      const typeValue = typeof exportType === 'object' ? exportType.value : exportType;
      const formatValue = typeof exportFormat === 'object' ? exportFormat.value : exportFormat;

      const response = await fetch(`${baseUrl}/api/v1/admin/export/${typeValue}?format=${formatValue}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${typeValue}_${new Date().toISOString().split('T')[0]}.${formatValue}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erreur lors de l\'export');
      }
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    { value: 'users', label: 'Utilisateurs' },
    { value: 'pulls', label: 'Cagnottes' },
    { value: 'contributions', label: 'Contributions' },
    { value: 'transactions', label: 'Transactions' },
    { value: 'logs', label: 'Journal d\'activité' }
  ];

  const formatOptions = [
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'Excel (XLSX)' },
    { value: 'json', label: 'JSON' }
  ];

  return (
    <Box p="xl">
      <H1 mb="lg" style={{ color: '#4CA260' }}>📊 Export des Données</H1>

      <Box maxWidth="600px">
        <Text mb="lg">
          Exportez vos données KOTIZ dans différents formats pour analyse ou archivage.
        </Text>

        <Box mb="xl">
          <FormGroup>
            <Label htmlFor="exportType" style={{ color: '#4CA260', fontWeight: 'bold' }}>
              Type de données à exporter
            </Label>
            <Select
              id="exportType"
              value={exportType}
              onChange={(selected) => setExportType(selected)}
              options={exportOptions}
            />
          </FormGroup>
        </Box>

        <Box mb="xl">
          <FormGroup>
            <Label htmlFor="exportFormat" style={{ color: '#4CA260', fontWeight: 'bold' }}>
              Format d'export
            </Label>
            <Select
              id="exportFormat"
              value={exportFormat}
              onChange={(selected) => setExportFormat(selected)}
              options={formatOptions}
            />
          </FormGroup>
        </Box>

        <Box mb="xl">
          <H2 mb="lg" style={{ color: '#3B5BAB' }}>📋 Aperçu des exports disponibles</H2>

          <Box mb="lg" p="lg" bg="#F8F9FA" borderRadius="lg" border="1px solid #E0E0E0">
            <H2 style={{ color: '#4CA260', fontSize: '18px' }}>Utilisateurs</H2>
            <Text>Nom, Email, Téléphone, Rôle, Statut vérification, Date d'inscription</Text>
          </Box>

          <Box mb="lg" p="lg" bg="#F8F9FA" borderRadius="lg" border="1px solid #E0E0E0">
            <H2 style={{ color: '#4CA260', fontSize: '18px' }}>Cagnottes</H2>
            <Text>Titre, Description, Montant objectif, Montant actuel, Statut, Dates</Text>
          </Box>

          <Box mb="lg" p="lg" bg="#F8F9FA" borderRadius="lg" border="1px solid #E0E0E0">
            <H2 style={{ color: '#4CA260', fontSize: '18px' }}>Contributions</H2>
            <Text>Montant, Statut, Méthode paiement, Date, Utilisateur contributeur</Text>
          </Box>

          <Box mb="lg" p="lg" bg="#F8F9FA" borderRadius="lg" border="1px solid #E0E0E0">
            <H2 style={{ color: '#4CA260', fontSize: '18px' }}>Transactions</H2>
            <Text>Référence, Montant, Statut, Méthode, Dates, Détails fournisseur</Text>
          </Box>

          <Box mb="lg" p="lg" bg="#F8F9FA" borderRadius="lg" border="1px solid #E0E0E0">
            <H2 style={{ color: '#4CA260', fontSize: '18px' }}>Journal d'activité</H2>
            <Text>Actions, Détails, Utilisateur, Horodatage, Adresse IP</Text>
          </Box>
        </Box>

        <Box display="flex" gap="lg" alignItems="center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleExport}
            disabled={isExporting}
            style={{
              backgroundColor: '#4CA260',
              borderColor: '#4CA260'
            }}
          >
            {isExporting ? '⏳ Export en cours...' : '📥 Lancer l\'export'}
          </Button>

          <Text fontSize="sm" color="#666666">
            L'export peut prendre quelques instants selon la taille des données.
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default Export;