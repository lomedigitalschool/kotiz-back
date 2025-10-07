import { Box, H1, H2, Text } from '@adminjs/design-system'

const Dashboard = (props) => {
  console.log('Dashboard component loaded with props:', props);

  return (
    <Box variant="grey">
      <Box variant="white" style={{ padding: '20px' }}>
        <H1>KOTIZ DASHBOARD ADMIN</H1>
        <H2>Dashboard personnalisé chargé avec succès!</H2>
        <Text>Statistiques et exports disponibles</Text>

        {props.data && (
          <Box style={{ marginTop: '20px' }}>
            <Text>Données reçues: {JSON.stringify(props.data, null, 2)}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;