import React from 'react';
import { Box, ButtonGroup, Button, Modal } from '@adminjs/design-system';

const ImagePreview = (props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { record, property } = props;

  if (!record?.params[property.path]) {
    return null;
  }

  return (
    <Box>
      <img 
        src={record.params[property.path]} 
        alt={`${property.path}`}
        style={{ 
          maxWidth: isOpen ? '90vw' : '200px',
          maxHeight: isOpen ? '90vh' : '150px',
          cursor: 'pointer'
        }}
        onClick={() => setIsOpen(true)}
      />
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Box>
          <img 
            src={record.params[property.path]} 
            alt={`${property.path} - Vue complète`}
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          />
        </Box>
        <ButtonGroup>
          <Button onClick={() => setIsOpen(false)}>Fermer</Button>
          <Button as="a" href={record.params[property.path]} target="_blank" variant="primary">
            Ouvrir dans un nouvel onglet
          </Button>
        </ButtonGroup>
      </Modal>
    </Box>
  );
};

export default ImagePreview;