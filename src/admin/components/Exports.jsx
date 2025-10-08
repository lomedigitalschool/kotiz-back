import React from "react";
import { Box, H2, Button, Text } from "@adminjs/design-system";

const Exports = () => {
  const handleExport = (type) => {
    window.open(`/admin/api/exports/${type}`, "_blank");
  };

  return (
    <Box variant="grey" p="lg">
      <H2>Exports de données</H2>
      <Text>Choisissez un type d'export :</Text>
      <Box mt="md">
        <Button onClick={() => handleExport("users")}>Exporter Utilisateurs</Button>
        <Button onClick={() => handleExport("transactions")} ml="md">
          Exporter Transactions
        </Button>
      </Box>
    </Box>
  );
};

export default Exports;