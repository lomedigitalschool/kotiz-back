import React from 'react';

const SelectField = (props) => {
  const { property, record, onChange } = props;

  const options = property.availableValues?.map(value => ({
    value: value.value,
    label: value.label
  })) || [];

  const currentValue = record.params?.[property.name] || record?.[property.name] || '';

  const handleChange = (event) => {
    onChange(property.name, event.target.value || '');
  };

  return (
    <select
      value={currentValue}
      onChange={handleChange}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
        backgroundColor: 'white',
        minHeight: '36px'
      }}
    >
      <option value="">Sélectionner...</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default SelectField;