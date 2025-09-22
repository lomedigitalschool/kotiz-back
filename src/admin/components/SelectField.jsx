import React from 'react';
import Select from 'react-select';

const SelectField = (props) => {
  const { property, record, onChange } = props;

  const options = property.availableValues?.map(value => ({
    value: value.value,
    label: value.label
  })) || [];

  const value = options.find(option => option.value === record.params[property.name]);

  const handleChange = (selectedOption) => {
    onChange(property.name, selectedOption?.value || '');
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      options={options}
      placeholder="Sélectionner..."
      isClearable
    />
  );
};

export default SelectField;