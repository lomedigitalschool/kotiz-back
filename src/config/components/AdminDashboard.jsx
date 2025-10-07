import React, { useEffect, useState } from 'react';
import {
  Box, H1, H2, H3, Text, Button, Table, TableHead, TableBody,
  TableRow, TableCell, Badge, Select
} from '@adminjs/design-system';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCollected: 0,
    activeCagnottes: 0,
    monthlyContributions: 0,
    monthlyContributionCount: 0,
    topCagnottes: [],
    recentActivity: [],
    systemHealth: 'good'
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [dataChanged, setDataChanged] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    dataType: 'contributions',
    format: 'csv'
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Mise à jour en arrière-plan toutes les 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData(true); // isBackground = true
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isBackground = false) => {
    try {
      const baseUrl = window.location.origin;

      // Récupération parallèle des données
      const [usersRes, contributionsRes, cagnottesRes, activityRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/users/stats`).catch(() => ({ ok: false })),
        fetch(`${baseUrl}/api/v1/contributions/stats`).catch(() => ({ ok: false })),
        fetch(`${baseUrl}/api/v1/pulls/stats`).catch(() => ({ ok: false })),
        fetch(`${baseUrl}/api/v1/admin/recent-activity`).catch(() => ({ ok: false }))
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : { total: 0 };
      const contributionsData = contributionsRes.ok ? await contributionsRes.json() : {
        totalCollected: 0, monthlyAmount: 0, monthlyCount: 0
      };
      const cagnottesData = cagnottesRes.ok ? await cagnottesRes.json() : {
        activeCount: 0, topCagnottes: []
      };
      const activityData = activityRes.ok ? await activityRes.json() : { activities: [] };

      const newMetrics = {
        totalUsers: usersData.total || 0,
        totalCollected: contributionsData.totalCollected || 0,
        activeCagnottes: cagnottesData.activeCount || cagnottesData.active || 0,
        monthlyContributions: contributionsData.monthlyAmount || 0,
        monthlyContributionCount: contributionsData.monthlyCount || 0,
        topCagnottes: cagnottesData.topCagnottes || [],
        recentActivity: activityData.activities || [],
        systemHealth: 'good'
      };

      // Vérifier si les données ont changé
      const hasChanged = JSON.stringify(newMetrics) !== JSON.stringify(metrics);

      setMetrics(newMetrics);

      // Ne mettre à jour l'heure que si c'est une mise à jour manuelle ou si les données ont changé
      if (!isBackground || hasChanged) {
        setLastUpdate(new Date());
        setDataChanged(hasChanged);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setLoading(false);
    }
  };

  const handleQuickExport = async () => {
    if (!exportConfig.dataType || !exportConfig.format) {
      alert('Veuillez sélectionner un type de données et un format');
      return;
    }

    try {
      setExportLoading(true);
      const baseUrl = window.location.origin;
      const endpoint = `/api/v1/admin/export/${exportConfig.dataType}?format=${exportConfig.format}&dateRange=30&status=all`;
      
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
        alert('Export terminé avec succès !');
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur export:', error);
      alert(`Erreur lors de l'export: ${error.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'USER_CREATED': return '👤';
      case 'PULL_CREATED': return '🎯';
      case 'CONTRIBUTION_MADE': return '💰';
      case 'ADMIN_LOGIN': return '🔐';
      case 'USER_BLOCKED': return '🚫';
      default: return '📝';
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case 'USER_CREATED': return 'success';
      case 'PULL_CREATED': return 'info';
      case 'CONTRIBUTION_MADE': return 'primary';
      case 'ADMIN_LOGIN': return 'warning';
      case 'USER_BLOCKED': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Box p="xl" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <Text mt="md">Chargement du dashboard...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box p="xl">
      {/* Header avec statut */}
      <Box display="flex" justifyContent="between" alignItems="center" mb="xl">
        <Box>
          <H1 color="primary">Dashboard Administrateur</H1>
          <Text color="grey60">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
          </Text>
        </Box>
        <Box display="flex" alignItems="center" gap="sm">
          <Badge variant={metrics.systemHealth === 'good' ? 'success' : 'danger'}>
            {metrics.systemHealth === 'good' ? 'Système OK' : 'Problème détecté'}
          </Badge>
          {dataChanged && (
            <Badge variant="info" size="sm">
              Mis à jour
            </Badge>
          )}
          <Button size="sm" variant="outlined" onClick={() => fetchDashboardData(false)}>
            Actualiser
          </Button>
        </Box>
      </Box>

      {/* Métriques principales */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap="lg" mb="xl">
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <Box display="flex" justifyContent="between" alignItems="center" mb="sm">
            <H3 color="primary">Utilisateurs</H3>
          </Box>
          <Text fontSize="h1" fontWeight="bold" color="success" mb="xs">
            {metrics.totalUsers.toLocaleString('fr-FR')}
          </Text>
          <Text fontSize="sm" color="grey60">Comptes actifs</Text>
        </Box>

        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <Box display="flex" justifyContent="between" alignItems="center" mb="sm">
            <H3 color="primary">Total collecté</H3>
          </Box>
          <Text fontSize="h1" fontWeight="bold" color="info" mb="xs">
            {formatCurrency(metrics.totalCollected)}
          </Text>
          <Text fontSize="sm" color="grey60">Depuis le lancement</Text>
        </Box>

        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <Box display="flex" justifyContent="between" alignItems="center" mb="sm">
            <H3 color="primary">Cagnottes actives</H3>
          </Box>
          <Text fontSize="h1" fontWeight="bold" color="warning" mb="xs">
            {metrics.activeCagnottes}
          </Text>
          <Text fontSize="sm" color="grey60">En cours de collecte</Text>
        </Box>

        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <Box display="flex" justifyContent="between" alignItems="center" mb="sm">
            <H3 color="primary">Ce mois</H3>
          </Box>
          <Text fontSize="h1" fontWeight="bold" color="success" mb="xs">
            {formatCurrency(metrics.monthlyContributions)}
          </Text>
          <Text fontSize="sm" color="grey60">
            {metrics.monthlyContributionCount} contributions
          </Text>
        </Box>
      </Box>

      {/* Contenu principal en deux colonnes */}
      <Box display="grid" gridTemplateColumns="2fr 1fr" gap="xl">
        {/* Top cagnottes */}
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H2 mb="lg" display="flex" alignItems="center">
            Top 5 Cagnottes
          </H2>
          {metrics.topCagnottes.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell fontWeight="bold">#</TableCell>
                  <TableCell fontWeight="bold">Titre</TableCell>
                  <TableCell fontWeight="bold" textAlign="right">Montant</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.topCagnottes.map((cagnotte, index) => (
                  <TableRow key={cagnotte.id}>
                    <TableCell>
                      <Badge variant={index === 0 ? 'success' : index === 1 ? 'info' : 'secondary'}>
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell>{cagnotte.title}</TableCell>
                    <TableCell textAlign="right" fontWeight="bold" color="success">
                      {formatCurrency(cagnotte.totalCollected)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Text color="grey60" textAlign="center" py="xl">
              Aucune donnée disponible
            </Text>
          )}
        </Box>

        {/* Activité récente */}
        <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
          <H2 mb="lg" display="flex" alignItems="center">
            Activité récente
          </H2>
          <Box maxHeight="400px" overflowY="auto">
            {metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.map((activity, index) => (
                <Box key={index} display="flex" alignItems="center" gap="sm" mb="sm" p="sm" 
                     bg="grey0" borderRadius="sm" border="1px solid" borderColor="grey10">
                  <Text fontSize="lg">{getActivityIcon(activity.action)}</Text>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="bold">
                      {activity.description || activity.action}
                    </Text>
                    <Text fontSize="xs" color="grey60">
                      {activity.user?.name || activity.user?.email || 'Admin'} • {new Date(activity.createdAt).toLocaleString('fr-FR')}
                    </Text>
                  </Box>
                  <Badge variant={getActivityColor(activity.action)} size="sm">
                    {activity.action}
                  </Badge>
                </Box>
              ))
            ) : (
              <Text color="grey60" textAlign="center" py="lg">
                Aucune activité récente
              </Text>
            )}
          </Box>
        </Box>
      </Box>

      {/* Export rapide */}
      <Box mt="xl" p="lg" bg="white" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
        <H3 mb="md" style={{ color: '#4CA260' }}>📤 Export rapide</H3>
        <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap="md" alignItems="end">
          <Box>
            <Text fontWeight="bold" mb="sm">Type de données</Text>
            <Select
              value={exportConfig.dataType}
              onChange={(value) => setExportConfig(prev => ({ ...prev, dataType: value }))}
              options={[
                { value: 'contributions', label: 'Contributions' },
                { value: 'users', label: 'Utilisateurs' },
                { value: 'pulls', label: 'Cagnottes' },
                { value: 'transactions', label: 'Transactions' }
              ]}
            />
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Format</Text>
            <Select
              value={exportConfig.format}
              onChange={(value) => setExportConfig(prev => ({ ...prev, format: value }))}
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'excel', label: 'Excel' },
                { value: 'pdf', label: 'PDF' }
              ]}
            />
          </Box>
          <Box>
            <Button
              variant="primary"
              onClick={handleQuickExport}
              disabled={exportLoading}
              style={{ width: '100%' }}
            >
              {exportLoading ? '⏳ Export...' : '🚀 Exporter'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Actions rapides */}
      <Box mt="lg" p="lg" bg="grey0" borderRadius="lg" border="1px solid" borderColor="grey20">
        <H3 mb="md">Actions rapides</H3>
        <Box display="flex" gap="md" flexWrap="wrap">
          <Button variant="primary" as="a" href="/admin/resources/User">
            Gérer les utilisateurs
          </Button>
          <Button variant="secondary" as="a" href="/admin/resources/Pull">
            Gérer les cagnottes
          </Button>
          <Button variant="success" as="a" href="/admin/resources/Report">
            Voir les signalements
          </Button>
          <Button variant="warning" as="a" href="/admin/pages/Exports">
            Exporter les données
          </Button>
          <Button variant="info" as="a" href="/admin/pages/Statistiques%20D%C3%A9taill%C3%A9es">
            Statistiques détaillées
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;