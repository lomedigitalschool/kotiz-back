import React from 'react';
import { Badge } from '@adminjs/design-system';

const BooleanListProperty = (props) => {
  const { record, property } = props;
  const value = record.params[property.name];

  return (
    <Badge variant={value ? 'success' : 'danger'}>
      {value ? 'Oui' : 'Non'}
    </Badge>
  );
};

export default BooleanListProperty;