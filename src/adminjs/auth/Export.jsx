import React, { useState } from 'react';
import { Box, H1, H2, Text, Button, Card, Table, TableHead, TableBody, TableRow, TableCell } from '@adminjs/design-system';

const Export = () => {
  const [exporting, setExporting] = useState({});

  const exportData = async (endpoint, format, filename) => {
    const key = `${endpoint}_${format}`;
    setExporting(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(`/api/v1/admin/export/${endpoint}/${format}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(`Erreur lors de l'export ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setExporting(prev => ({ ...prev, [key]: false }));
    }
  };

  const exportSections = [
    {
      title: '📊 Contributions',
      description: 'Exporter les données des contributions (montants, statuts, contributeurs)',
      endpoint: 'contributions',
      filename: 'contributions'
    },
    {
      title: '💰 Retraits',
      description: 'Exporter les données des retraits (cagnottes clôturées, montants à payer)',
      endpoint: 'retraits',
      filename: 'retraits'
    },
    {
      title: '👥 Utilisateurs',
      description: 'Exporter la liste complète des utilisateurs (profils, statuts)',
      endpoint: 'users',
      filename: 'utilisateurs'
    }
  ];

  const formatOptions = [
    { key: 'csv', label: 'CSV', icon: '📊', description: 'Format tableur simple' },
    { key: 'excel', label: 'Excel', icon: '📈', description: 'Format Microsoft Excel' },
    { key: 'pdf', label: 'PDF', icon: '📄', description: 'Format document portable' }
  ];

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1>Exports de Données</H1>
        <Text fontSize="sm" color="grey60">
          Exportez vos données dans différents formats
        </Text>
      </Box>

      {/* Informations générales */}
      <Box bg="#e3f2fd" p="lg" borderRadius="lg" border="1px solid" borderColor="#bbdefb" mb="xl">
        <H2 mb="md" style={{ color: '#1976d2' }}>ℹ️ Informations sur les exports</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="md">
          <Box>
            <Text fontWeight="bold" mb="sm">Formats disponibles:</Text>
            <Text fontSize="sm" mb="sm">
              • <strong>CSV:</strong> Format simple pour tableurs<br/>
              • <strong>Excel:</strong> Format Microsoft Excel (.xlsx)<br/>
              • <strong>PDF:</strong> Document formaté et imprimable
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Limites:</Text>
            <Text fontSize="sm" mb="sm">
              • Maximum 10 000 éléments par export<br/>
              • Exports générés en temps réel<br/>
              • Téléchargement automatique
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Sécurité:</Text>
            <Text fontSize="sm" mb="sm">
              • Données anonymisées si nécessaire<br/>
              • Accès réservé aux administrateurs<br/>
              • Logs d'export conservés
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Sections d'export */}
      <Box display="grid" gap="lg">
        {exportSections.map((section) => (
          <Card key={section.endpoint} p="lg" bg="white" borderRadius="lg" boxShadow="card">
            <Box mb="md">
              <H2 style={{ color: '#4CA260' }}>{section.title}</H2>
              <Text color="grey60">{section.description}</Text>
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="md">
              {formatOptions.map((format) => {
                const key = `${section.endpoint}_${format.key}`;
                const isExporting = exporting[key];

                return (
                  <Box key={format.key} p="md" bg="#f8f9fa" borderRadius="md" border="1px solid" borderColor="#e9ecef">
                    <Text fontWeight="bold" mb="sm">
                      {format.icon} {format.label}
                    </Text>
                    <Text fontSize="sm" color="grey60" mb="md">
                      {format.description}
                    </Text>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => exportData(section.endpoint, format.key, section.filename)}
                      disabled={isExporting}
                      style={{ width: '100%' }}
                    >
                      {isExporting ? '⏳ Export...' : `📥 Télécharger ${format.label}`}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Card>
        ))}
      </Box>

      {/* Historique des exports récents */}
      <Box mt="xl">
        <H2 mb="lg" style={{ color: '#4CA260' }}>📋 Exports récents</H2>
        <Box bg="white" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell fontWeight="bold">Type</TableCell>
                <TableCell fontWeight="bold">Format</TableCell>
                <TableCell fontWeight="bold">Date</TableCell>
                <TableCell fontWeight="bold">Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Ici, vous pouvez ajouter un historique réel depuis l'API */}
              <TableRow>
                <TableCell>Contributions</TableCell>
                <TableCell>Excel</TableCell>
                <TableCell>{new Date().toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                  <Box as="span" px="sm" py="xs" borderRadius="sm" bg="#4CAF50" color="white" fontSize="sm">
                    Succès
                  </Box>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Utilisateurs</TableCell>
                <TableCell>PDF</TableCell>
                <TableCell>{new Date(Date.now() - 86400000).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                  <Box as="span" px="sm" py="xs" borderRadius="sm" bg="#4CAF50" color="white" fontSize="sm">
                    Succès
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* Conseils d'utilisation */}
      <Box mt="xl" p="lg" bg="#fff3cd" borderRadius="lg" border="1px solid" borderColor="#ffeaa7">
        <H2 mb="md" style={{ color: '#856404' }}>💡 Conseils d'utilisation</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="md">
          <Box>
            <Text fontWeight="bold" mb="sm">Pour l'analyse:</Text>
            <Text fontSize="sm">
              • Utilisez Excel pour des analyses complexes<br/>
              • CSV pour l'import dans d'autres outils<br/>
              • PDF pour l'archivage et le partage
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Performance:</Text>
            <Text fontSize="sm">
              • Exports volumineux peuvent prendre du temps<br/>
              • Préférez les exports hors heures de pointe<br/>
              • Vérifiez la connectivité réseau
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Confidentialité:</Text>
            <Text fontSize="sm">
              • Les données sensibles sont masquées<br/>
              • Exports tracés dans les logs<br/>
              • Suppression automatique des fichiers temporaires
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Export;