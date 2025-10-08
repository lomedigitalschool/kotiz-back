import React, { useEffect, useState } from "react";
import { Box, H2, Text, Card, Grid } from "@adminjs/design-system";

const Dashboard = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetch("/api/v1/adminjs/dashboard-stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => setStats({}));
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <Card p="lg" style={{ borderLeft: `4px solid ${color}`, background: '#f8f9fa' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Text fontSize="sm" color="grey60" mb="xs">{title}</Text>
          <H2 color={color} mb="0">{value}</H2>
        </Box>
        <Text fontSize="2xl">{icon}</Text>
      </Box>
    </Card>
  );

  return (
    <Box p="lg">
      <Box mb="xl">
        <H2 mb="lg" style={{ color: '#2c3e50', fontSize: '28px' }}>🚀 Tableau de bord KOTIZ</H2>
        <Text color="grey60" fontSize="md">Aperçu des statistiques de la plateforme</Text>
      </Box>
      
      <Grid gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap="lg">
        <StatCard 
          title="Utilisateurs inscrits"
          value={stats.userCount || 0}
          icon="👥"
          color="#3498db"
        />
        <StatCard 
          title="Cagnottes actives"
          value={stats.activePools || 0}
          icon="🎯"
          color="#2ecc71"
        />
        <StatCard 
          title="Montant total collecté"
          value={`${(stats.totalAmount || 0).toLocaleString()} FCFA`}
          icon="💰"
          color="#f39c12"
        />
        <StatCard 
          title="Total cagnottes"
          value={stats.poolCount || 0}
          icon="📊"
          color="#9b59b6"
        />
      </Grid>
      
      <Box mt="xl" p="lg" style={{ background: '#e8f5e8', borderRadius: '8px', border: '1px solid #2ecc71' }}>
        <Text fontSize="md" color="#27ae60">
          ✅ Système opérationnel - Toutes les fonctionnalités sont actives
        </Text>
      </Box>
    </Box>
  );
};

export default Dashboard;