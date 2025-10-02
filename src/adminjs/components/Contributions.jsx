import React, { useEffect, useState } from 'react';
import { Box, H1, H2, Text, Table, TableHead, TableBody, TableRow, TableCell, Button, Input, Select } from '@adminjs/design-system';

const Contributions = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
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
    fetchContributions();
  }, [filters]);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/v1/admin/contributions?${queryParams}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setContributions(data.data || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Erreur chargement contributions:', error);
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
      const response = await fetch(`/api/v1/admin/export/contributions/${format}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contributions_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  if (loading) {
    return (
      <Box p="xl">
        <Text>Chargement des contributions...</Text>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg">
        <H1>Gestion des Contributions</H1>
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
                { value: '', label: 'Tous les statuts' },
                { value: 'pending', label: 'En attente' },
                { value: 'completed', label: 'Terminée' },
                { value: 'failed', label: 'Échouée' }
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
          <Text fontSize="sm">Total Contributions</Text>
          <Text fontSize="h2" fontWeight="bold">{pagination.totalItems}</Text>
        </Box>
        <Box bg="#3B5BAB" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Terminées</Text>
          <Text fontSize="h2" fontWeight="bold">
            {contributions.filter(c => c.status === 'completed').length}
          </Text>
        </Box>
        <Box bg="#FF9800" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">En attente</Text>
          <Text fontSize="h2" fontWeight="bold">
            {contributions.filter(c => c.status === 'pending').length}
          </Text>
        </Box>
        <Box bg="#F44336" p="md" borderRadius="lg" color="white">
          <Text fontSize="sm">Échouées</Text>
          <Text fontSize="h2" fontWeight="bold">
            {contributions.filter(c => c.status === 'failed').length}
          </Text>
        </Box>
      </Box>

      {/* Table des contributions */}
      <Box bg="white" borderRadius="lg" boxShadow="card" border="1px solid" borderColor="grey20">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell fontWeight="bold">ID</TableCell>
              <TableCell fontWeight="bold">Cagnotte</TableCell>
              <TableCell fontWeight="bold">Contributeur</TableCell>
              <TableCell fontWeight="bold">Montant</TableCell>
              <TableCell fontWeight="bold">Statut</TableCell>
              <TableCell fontWeight="bold">Méthode</TableCell>
              <TableCell fontWeight="bold">Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contributions.map((contribution) => (
              <TableRow key={contribution.id}>
                <TableCell>{contribution.id}</TableCell>
                <TableCell>{contribution.Pull?.title || 'N/A'}</TableCell>
                <TableCell>
                  {contribution.contributor?.name || contribution.contributorName || 'Anonyme'}
                </TableCell>
                <TableCell fontWeight="bold" style={{ color: '#4CA260' }}>
                  {formatCurrency(contribution.amount)}
                </TableCell>
                <TableCell>
                  <Box
                    as="span"
                    px="sm"
                    py="xs"
                    borderRadius="sm"
                    fontSize="sm"
                    fontWeight="bold"
                    style={{
                      backgroundColor:
                        contribution.status === 'completed' ? '#4CAF50' :
                        contribution.status === 'pending' ? '#FF9800' : '#F44336',
                      color: 'white'
                    }}
                  >
                    {contribution.status === 'completed' ? 'Terminée' :
                     contribution.status === 'pending' ? 'En attente' : 'Échouée'}
                  </Box>
                </TableCell>
                <TableCell>{contribution.paymentMethod || 'N/A'}</TableCell>
                <TableCell>
                  {new Date(contribution.createdAt).toLocaleDateString('fr-FR')}
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
    </Box>
  );
};

export default Contributions;