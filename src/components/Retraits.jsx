import React, { useEffect, useState } from 'react';
import { Box, H1, H2, Text, Table, TableHead, TableBody, TableRow, TableCell, Button, Input, Select } from '@adminjs/design-system';

const Retraits = () => {
  const [retraits, setRetraits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'closed',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50
  });

  useEffect(() => {
    fetchRetraits();
  }, [filters]);

  const fetchRetraits = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/v1/admin/retraits?${queryParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRetraits(data.data || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Erreur chargement retraits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  const exportData = async (format) => {
    try {
      const response = await fetch(`/api/v1/admin/export/retraits/${format}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `retraits_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  const processWithdrawal = async (pullId) => {
    if (!confirm('Confirmer le traitement de ce retrait ?')) return;

    try {
      // Ici, vous pouvez ajouter une route API pour marquer le retrait comme traité
      alert('Fonctionnalité de traitement des retraits à implémenter');
    } catch (error) {
      console.error('Erreur traitement retrait:', error);
    }
  };

  if (loading) {
    return (
      <Box p="xl">
        <Text>Chargement des retraits...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1>Gestion des Retraits</H1>
        <Box display="flex" gap="md">
          <Button variant="secondary" onClick={() => exportData('csv')}>
            📊 Export CSV
          </Button>
          <Button variant="secondary" onClick={() => exportData('excel')}>
            📈 Export Excel
          </Button>
          <Button variant="secondary" onClick={() => exportData('pdf')}>
            📄 Export PDF
          </Button>
        </Box>
      </Box>

      {/* Filtres */}
      <Box bg="white" p="lg" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20" mb="lg">
        <H2 mb="md" style={{ color: '#4CA260' }}>🔍 Filtres</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="md">
          <Box>
            <Text fontWeight="bold" mb="sm">Statut</Text>
            <Select
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: 'closed', label: 'Cagnottes clôturées' },
                { value: 'all', label: 'Tous les statuts' }
              ]}
            />
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Date début</Text>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Date fin</Text>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Éléments par page</Text>
            <Select
              value={filters.limit.toString()}
              onChange={(value) => handleFilterChange('limit', parseInt(value))}
              options={[
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' }
              ]}
            />
          </Box>
        </Box>
      </Box>

      {/* Statistiques */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="lg" mb="lg">
        <Box bg="#4CA260" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Total Retraits</Text>
          <Text fontSize="h2" fontWeight="bold">{pagination.totalItems}</Text>
        </Box>
        <Box bg="#3B5BAB" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Montant Total</Text>
          <Text fontSize="h2" fontWeight="bold">
            {formatCurrency(retraits.reduce((sum, r) => sum + (r.totalCollected || 0), 0))}
          </Text>
        </Box>
        <Box bg="#FF9800" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Frais Totaux</Text>
          <Text fontSize="h2" fontWeight="bold">
            {formatCurrency(retraits.reduce((sum, r) => sum + (r.fees || 0), 0))}
          </Text>
        </Box>
        <Box bg="#F44336" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">À Payer</Text>
          <Text fontSize="h2" fontWeight="bold">
            {formatCurrency(retraits.reduce((sum, r) => sum + (r.withdrawalAmount || 0), 0))}
          </Text>
        </Box>
      </Box>

      {/* Table des retraits */}
      <Box bg="white" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">ID</TableCell>
              <TableCell fontWeight="bold">Titre Cagnotte</TableCell>
              <TableCell fontWeight="bold">Propriétaire</TableCell>
              <TableCell fontWeight="bold">Montant Collecté</TableCell>
              <TableCell fontWeight="bold">Frais (5%)</TableCell>
              <TableCell fontWeight="bold">Montant Retrait</TableCell>
              <TableCell fontWeight="bold">Date Clôture</TableCell>
              <TableCell fontWeight="bold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {retraits.map((retrait) => (
              <TableRow key={retrait.id}>
                <TableCell>{retrait.id}</TableCell>
                <TableCell>{retrait.title}</TableCell>
                <TableCell>{retrait.owner?.name || 'N/A'}</TableCell>
                <TableCell fontWeight="bold" style={{ color: '#4CA260' }}>
                  {formatCurrency(retrait.totalCollected)}
                </TableCell>
                <TableCell style={{ color: '#FF9800' }}>
                  {formatCurrency(retrait.fees)}
                </TableCell>
                <TableCell fontWeight="bold" style={{ color: '#3B5BAB' }}>
                  {formatCurrency(retrait.withdrawalAmount)}
                </TableCell>
                <TableCell>
                  {new Date(retrait.updatedAt).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => processWithdrawal(retrait.id)}
                  >
                    Traiter
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" alignItems="center" gap="md" mt="lg">
        <Button
          variant="outlined"
          disabled={pagination.currentPage === 1}
          onClick={() => handlePageChange(pagination.currentPage - 1)}
        >
          Précédent
        </Button>
        <Text>
          Page {pagination.currentPage} sur {pagination.totalPages}
          ({pagination.totalItems} éléments)
        </Text>
        <Button
          variant="outlined"
          disabled={pagination.currentPage === pagination.totalPages}
          onClick={() => handlePageChange(pagination.currentPage + 1)}
        >
          Suivant
        </Button>
      </Box>

      {/* Informations sur les retraits */}
      <Box mt="xl" p="lg" bg="#f8f9fa" borderRadius="lg" border="1px solid" borderColor="#e9ecef">
        <H2 mb="md" style={{ color: '#495057' }}>ℹ️ Informations sur les retraits</H2>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap="md">
          <Box>
            <Text fontWeight="bold" mb="sm">Processus de retrait:</Text>
            <Text fontSize="sm">
              1. La cagnotte atteint son objectif ou est clôturée<br/>
              2. Calcul des frais (5% du montant collecté)<br/>
              3. Virement du montant net sur le compte du propriétaire<br/>
              4. Confirmation et archivage
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Frais de plateforme:</Text>
            <Text fontSize="sm">
              • 5% du montant total collecté<br/>
              • Frais de transaction bancaire inclus<br/>
              • Commission pour sécurisation des paiements
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" mb="sm">Délais de traitement:</Text>
            <Text fontSize="sm">
              • Virement sous 2-3 jours ouvrés<br/>
              • Confirmation par email<br/>
              • Suivi possible via l'historique
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Retraits;