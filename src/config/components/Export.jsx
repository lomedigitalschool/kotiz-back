import React, { useState } from 'react';
import { Box, H1, H2, Text, Button, Input, Select, Table, TableHead, TableBody, TableRow, TableCell } from '@adminjs/design-system';

const Export = (props) => {
  const [exportConfig, setExportConfig] = useState({
    dataType: 'contributions',
    format: 'csv',
    dateRange: '30',
    customStartDate: '',
    customEndDate: '',
    status: 'all',
    includeInactive: false
  });
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);

  const handleExport = async () => {
    if (!exportConfig.dataType || !exportConfig.format) {
      alert('Veuillez sélectionner un type de données et un format');
      return;
    }

    try {
      setLoading(true);
      const baseUrl = window.location.origin;

      // Construction des paramètres de requête
      const params = new URLSearchParams({
        format: exportConfig.format,
        dateRange: exportConfig.dateRange,
        status: exportConfig.status,
        includeInactive: exportConfig.includeInactive.toString()
      });

      if (exportConfig.dateRange === 'custom') {
        if (exportConfig.customStartDate) params.append('startDate', exportConfig.customStartDate);
        if (exportConfig.customEndDate) params.append('endDate', exportConfig.customEndDate);
      }

      const endpoint = `/api/v1/admin/export/${exportConfig.dataType}?${params}`;
      const response = await fetch(`${baseUrl}${endpoint}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportConfig.dataType}_${new Date().toISOString().split('T')[0]}.${exportConfig.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Ajouter à l'historique
        const newExport = {
          id: Date.now(),
          dataType: exportConfig.dataType,
          format: exportConfig.format,
          dateRange: exportConfig.dateRange,
          timestamp: new Date().toLocaleString('fr-FR'),
          status: 'success'
        };
        setExportHistory(prev => [newExport, ...prev]);

        alert('Export terminé avec succès !');
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur export:', error);

      // Ajouter à l'historique avec erreur
      const failedExport = {
        id: Date.now(),
        dataType: exportConfig.dataType,
        format: exportConfig.format,
        dateRange: exportConfig.dateRange,
        timestamp: new Date().toLocaleString('fr-FR'),
        status: 'error',
        error: error.message
      };
      setExportHistory(prev => [failedExport, ...prev]);

      alert(`Erreur lors de l'export: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDataTypeLabel = (type) => {
    const labels = {
      contributions: 'Contributions',
      users: 'Utilisateurs',
      pulls: 'Cagnottes',
      transactions: 'Transactions',
      kyc: 'Vérifications KYC',
      reports: 'Signalements',
      retraits: 'Retraits'
    };
    return labels[type] || type;
  };

  const getFormatLabel = (format) => {
    const labels = {
      csv: 'CSV',
      excel: 'Excel',
      pdf: 'PDF',
      json: 'JSON'
    };
    return labels[format] || format;
  };

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1>📤 Exports de Données</H1>
        <Button
          variant="secondary"
          onClick={() => setExportHistory([])}
          disabled={exportHistory.length === 0}
        >
          🗑️ Vider l'historique
        </Button>
      </Box>

      {/* Configuration d'export */}
      <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20" mb="lg">
        <H2 mb="lg" style={{ color: '#4CA260' }}>⚙️ Configuration d'export</H2>

        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="lg">
          {/* Type de données */}
          <Box>
            <Text fontWeight="bold" mb="sm">Type de données</Text>
            <Select
              value={exportConfig.dataType}
              onChange={(value) => setExportConfig(prev => ({ ...prev, dataType: value }))}
              options={[
                { value: 'contributions', label: '📊 Contributions' },
                { value: 'users', label: '👥 Utilisateurs' },
                { value: 'pulls', label: '🎯 Cagnottes' },
                { value: 'transactions', label: '🔄 Transactions' },
                { value: 'kyc', label: '🆔 Vérifications KYC' },
                { value: 'reports', label: '🚨 Signalements' },
                { value: 'retraits', label: '💸 Retraits' }
              ]}
            />
          </Box>

          {/* Format */}
          <Box>
            <Text fontWeight="bold" mb="sm">Format d'export</Text>
            <Select
              value={exportConfig.format}
              onChange={(value) => setExportConfig(prev => ({ ...prev, format: value }))}
              options={[
                { value: 'csv', label: '📄 CSV (Compatible Excel)' },
                { value: 'excel', label: '📊 Excel (.xlsx)' },
                { value: 'pdf', label: '📕 PDF' },
                { value: 'json', label: '💾 JSON' }
              ]}
            />
          </Box>

          {/* Période */}
          <Box>
            <Text fontWeight="bold" mb="sm">Période</Text>
            <Select
              value={exportConfig.dateRange}
              onChange={(value) => setExportConfig(prev => ({ ...prev, dateRange: value }))}
              options={[
                { value: '7', label: '📅 7 derniers jours' },
                { value: '30', label: '📅 30 derniers jours' },
                { value: '90', label: '📅 90 derniers jours' },
                { value: '365', label: '📅 1 an' },
                { value: 'all', label: '📅 Toutes les données' },
                { value: 'custom', label: '📅 Période personnalisée' }
              ]}
            />
          </Box>

          {/* Statut */}
          <Box>
            <Text fontWeight="bold" mb="sm">Statut</Text>
            <Select
              value={exportConfig.status}
              onChange={(value) => setExportConfig(prev => ({ ...prev, status: value }))}
              options={[
                { value: 'all', label: '🔄 Tous les statuts' },
                { value: 'active', label: '✅ Actif/Validé' },
                { value: 'pending', label: '⏳ En attente' },
                { value: 'completed', label: '✅ Terminé' },
                { value: 'failed', label: '❌ Échoué/Rejeté' }
              ]}
            />
          </Box>
        </Box>

        {/* Dates personnalisées */}
        {exportConfig.dateRange === 'custom' && (
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap="md" mt="lg" p="md" bg="grey0" borderRadius="md">
            <Box>
              <Text fontWeight="bold" mb="sm">Date de début</Text>
              <Input
                type="date"
                value={exportConfig.customStartDate}
                onChange={(e) => setExportConfig(prev => ({ ...prev, customStartDate: e.target.value }))}
              />
            </Box>
            <Box>
              <Text fontWeight="bold" mb="sm">Date de fin</Text>
              <Input
                type="date"
                value={exportConfig.customEndDate}
                onChange={(e) => setExportConfig(prev => ({ ...prev, customEndDate: e.target.value }))}
              />
            </Box>
          </Box>
        )}

        {/* Options avancées */}
        <Box mt="lg" p="md" bg="grey0" borderRadius="md">
          <Text fontWeight="bold" mb="sm">Options avancées</Text>
          <Box display="flex" alignItems="center" gap="md">
            <input
              type="checkbox"
              id="includeInactive"
              checked={exportConfig.includeInactive}
              onChange={(e) => setExportConfig(prev => ({ ...prev, includeInactive: e.target.checked }))}
            />
            <label htmlFor="includeInactive">
              Inclure les données inactives/archivées
            </label>
          </Box>
        </Box>

        {/* Bouton d'export */}
        <Box mt="lg" display="flex" justifyContent="center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleExport}
            disabled={loading}
            style={{ padding: '15px 30px', fontSize: '16px' }}
          >
            {loading ? '⏳ Export en cours...' : '🚀 Lancer l\'export'}
          </Button>
        </Box>
      </Box>

      {/* Informations sur les exports */}
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap="xl" mb="lg">
        {/* Formats supportés */}
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H2 mb="md" style={{ color: '#4CA260' }}>📋 Formats supportés</H2>
          <Box display="grid" gap="sm">
            <Box display="flex" alignItems="center" gap="sm">
              <Text fontSize="lg">📄</Text>
              <Box>
                <Text fontWeight="bold">CSV</Text>
                <Text fontSize="sm" color="grey60">Compatible Excel, traitement facile</Text>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap="sm">
              <Text fontSize="lg">📊</Text>
              <Box>
                <Text fontWeight="bold">Excel</Text>
                <Text fontSize="sm" color="grey60">Feuilles de calcul avec formatage</Text>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap="sm">
              <Text fontSize="lg">📕</Text>
              <Box>
                <Text fontSize="sm" color="grey60">Rapports formatés et imprimables</Text>
                <Text fontWeight="bold">PDF</Text>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap="sm">
              <Text fontSize="lg">💾</Text>
              <Box>
                <Text fontWeight="bold">JSON</Text>
                <Text fontSize="sm" color="grey60">Données brutes pour développeurs</Text>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Types de données */}
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H2 mb="md" style={{ color: '#4CA260' }}>📊 Types de données</H2>
          <Box display="grid" gap="sm">
            <Box display="flex" alignItems="center" gap="sm">
              <Text fontSize="lg">👥</Text>
              <Box>
                <Text fontWeight="bold">Utilisateurs</Text>
                <Text fontSize="sm" color="grey60">Profils, statuts, dates d'inscription</Text>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap="sm">
              <Text fontSize="lg">🎯</Text>
              <Box>
                <Text fontWeight="bold">Cagnottes</Text>
                <Text fontSize="sm" color="grey60">Détails, objectifs, statuts</Text>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap="sm">
              <Text fontSize="lg">💰</Text>
              <Box>
                <Text fontWeight="bold">Contributions</Text>
                <Text fontSize="sm" color="grey60">Montants, dates, méthodes de paiement</Text>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap="sm">
              <Text fontSize="lg">🔄</Text>
              <Box>
                <Text fontWeight="bold">Transactions</Text>
                <Text fontSize="sm" color="grey60">Historique des paiements</Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Historique des exports */}
      <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
        <H2 mb="lg" style={{ color: '#4CA260' }}>📚 Historique des exports</H2>
        {exportHistory.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell fontWeight="bold">Type</TableCell>
                <TableCell fontWeight="bold">Format</TableCell>
                <TableCell fontWeight="bold">Période</TableCell>
                <TableCell fontWeight="bold">Date</TableCell>
                <TableCell fontWeight="bold">Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exportHistory.map((exportItem) => (
                <TableRow key={exportItem.id}>
                  <TableCell>{getDataTypeLabel(exportItem.dataType)}</TableCell>
                  <TableCell>{getFormatLabel(exportItem.format)}</TableCell>
                  <TableCell>{exportItem.dateRange === 'custom' ? 'Personnalisée' : `${exportItem.dateRange} jours`}</TableCell>
                  <TableCell>{exportItem.timestamp}</TableCell>
                  <TableCell>
                    <Box
                      as="span"
                      px="sm"
                      py="xs"
                      borderRadius="sm"
                      fontSize="sm"
                      fontWeight="bold"
                      style={{
                        backgroundColor: exportItem.status === 'success' ? '#4CAF50' : '#F44336',
                        color: 'white'
                      }}
                    >
                      {exportItem.status === 'success' ? '✅ Succès' : '❌ Échec'}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Text color="grey60" textAlign="center" py="xl">
            Aucun export effectué pour le moment
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default Export;