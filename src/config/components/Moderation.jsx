import React, { useEffect, useState } from 'react';
import { Box, H1, H2, H3, Text, Button, Table, TableHead, TableBody, TableRow, TableCell, Badge, Select } from '@adminjs/design-system';

const Moderation = () => {
  const [pendingPulls, setPendingPulls] = useState([]);
  const [reportedContent, setReportedContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    try {
      const baseUrl = window.location.origin;

      // Récupérer les cagnottes en attente de validation
      const pullsRes = await fetch(`${baseUrl}/api/v1/admin/pulls/pending`, {
        credentials: 'include'
      });
      const pulls = pullsRes.ok ? await pullsRes.json() : [];

      // Récupérer les signalements
      const reportsRes = await fetch(`${baseUrl}/api/v1/admin/reports`, {
        credentials: 'include'
      });
      const reports = reportsRes.ok ? await reportsRes.json() : [];

      setPendingPulls(pulls);
      setReportedContent(reports);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement modération:', error);
      setLoading(false);
    }
  };

  const handlePullAction = async (pullId, action) => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/v1/admin/pulls/${pullId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Actualiser les données
        fetchModerationData();
      } else {
        alert('Erreur lors de l\'action');
      }
    } catch (error) {
      console.error('Erreur action:', error);
      alert('Erreur lors de l\'action');
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/v1/admin/reports/${reportId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Actualiser les données
        fetchModerationData();
      } else {
        alert('Erreur lors de l\'action');
      }
    } catch (error) {
      console.error('Erreur action:', error);
      alert('Erreur lors de l\'action');
    }
  };

  if (loading) {
    return (
      <Box p="xl">
        <Text>Chargement des données de modération...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1 style={{ color: '#4CA260' }}>🛡️ Modération</H1>
        <Button variant="primary" onClick={fetchModerationData}>
          Actualiser
        </Button>
      </Box>

      {/* Cagnottes en attente de validation */}
      <Box mb="xl">
        <H2 mb="lg" style={{ color: '#3B5BAB' }}>⏳ Cagnottes en attente de validation</H2>

        {pendingPulls.length === 0 ? (
          <Box p="lg" bg="#F8F9FA" borderRadius="lg" textAlign="center">
            <Text color="#666666">Aucune cagnotte en attente de validation</Text>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell fontWeight="bold">Titre</TableCell>
                <TableCell fontWeight="bold">Créateur</TableCell>
                <TableCell fontWeight="bold">Objectif</TableCell>
                <TableCell fontWeight="bold">Date création</TableCell>
                <TableCell fontWeight="bold">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingPulls.map((pull) => (
                <TableRow key={pull.id}>
                  <TableCell>{pull.title}</TableCell>
                  <TableCell>{pull.user?.name || 'Utilisateur inconnu'}</TableCell>
                  <TableCell>{new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF'
                  }).format(pull.goalAmount)}</TableCell>
                  <TableCell>{new Date(pull.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <Box display="flex" gap="sm">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handlePullAction(pull.id, 'approve')}
                      >
                        ✅ Approuver
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handlePullAction(pull.id, 'reject')}
                      >
                        ❌ Rejeter
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Contenu signalé */}
      <Box mb="xl">
        <H2 mb="lg" style={{ color: '#3B5BAB' }}>🚨 Contenu signalé</H2>

        {reportedContent.length === 0 ? (
          <Box p="lg" bg="#F8F9FA" borderRadius="lg" textAlign="center">
            <Text color="#666666">Aucun contenu signalé</Text>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell fontWeight="bold">Type</TableCell>
                <TableCell fontWeight="bold">Contenu</TableCell>
                <TableCell fontWeight="bold">Signalé par</TableCell>
                <TableCell fontWeight="bold">Motif</TableCell>
                <TableCell fontWeight="bold">Date</TableCell>
                <TableCell fontWeight="bold">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportedContent.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Badge variant={report.type === 'pull' ? 'info' : 'warning'}>
                      {report.type === 'pull' ? 'Cagnotte' : 'Contribution'}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.content?.title || report.content?.message || 'Contenu supprimé'}</TableCell>
                  <TableCell>{report.reporter?.name || 'Utilisateur inconnu'}</TableCell>
                  <TableCell>{report.reason}</TableCell>
                  <TableCell>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <Box display="flex" gap="sm">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReportAction(report.id, 'block')}
                      >
                        🚫 Bloquer
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReportAction(report.id, 'dismiss')}
                      >
                        👎 Rejeter
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Statistiques de modération */}
      <Box>
        <H2 mb="lg" style={{ color: '#4CA260' }}>📊 Statistiques de modération</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="lg">
          <Box bg="#4CA260" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">En attente</H3>
            <Text fontSize="h1" fontWeight="bold">{pendingPulls.length}</Text>
            <Text fontSize="sm">Cagnottes à valider</Text>
          </Box>
          <Box bg="#3B5BAB" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Signalements</H3>
            <Text fontSize="h1" fontWeight="bold">{reportedContent.length}</Text>
            <Text fontSize="sm">Contenus signalés</Text>
          </Box>
          <Box bg="#FF9800" p="lg" borderRadius="lg" color="white">
            <H3 mb="sm">Actions aujourd'hui</H3>
            <Text fontSize="h1" fontWeight="bold">0</Text>
            <Text fontSize="sm">Modérations effectuées</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Moderation;