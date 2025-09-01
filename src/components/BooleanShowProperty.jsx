import React from 'react';
import { Badge } from '@adminjs/design-system';

const BooleanShowProperty = (props) => {
  const { record, property } = props;
  const value = record.params[property.name];

  return (
    <Badge variant={value ? 'success' : 'danger'} size="lg">
      {value ? 'Oui' : 'Non'}
    </Badge>
  );
};

export default BooleanShowProperty;