
import React, { useState } from 'react';
import schema from './formSchema.json';
import './App.css';

const renderField = (field, value, onChange, index = null, path = '') => {
  const name = path ? `${path}.${index}.${field.name}` : field.name;

  const handleChange = (e) => {
    const val = field.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(name, val);
  };

  const baseClass = "w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";

  switch (field.type) {
    case 'text':
    case 'number':
      return <input type={field.type} name={name} value={value || ''} onChange={handleChange} className={baseClass} placeholder={field.label} />;
    case 'select':
      return (
        <select name={name} value={value || ''} onChange={handleChange} className={baseClass}>
          <option value="">Select {field.label}</option>
          {field.options.map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'radio':
      return (
        <div className="flex flex-wrap gap-4">
          {field.options.map((opt, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name={name}
                value={opt}
                checked={value === opt}
                onChange={handleChange}
              /> {opt} 
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" name={name} checked={!!value} onChange={handleChange} />
          {field.label}
        </label>
      );
    default:
      return null;
  }
};

const RepeatableFieldGroup = ({ field, data, onChange }) => {
  const values = data[field.name] || [];

  const handleSubChange = (i, subName, val) => {
    const updated = [...values];
    const [_, __, key] = subName.split('.');
    updated[i] = { ...updated[i], [key]: val };
    onChange(field.name, updated);
  };

  const addGroup = () => onChange(field.name, [...values, {}]);
  const removeGroup = (i) => {
    const updated = [...values];
    updated.splice(i, 1);
    onChange(field.name, updated);
  };

  return (
    <div>
      <label className="text-lg font-semibold block mb-2">{field.label}</label>
      {values.map((group, i) => (
        <div key={i} className="repeatable-group">
          {field.fields.map((subField, j) => (
            <div key={j} className="field-group">
              <label>{subField.label}</label>
              {renderField(subField, group[subField.name], (name, val) => handleSubChange(i, name, val), i, field.name)}
            </div>
          ))}
          <button type="button" onClick={() => removeGroup(i)} className="remove-btn">Remove</button>
        </div>
      ))}
      <button type="button" onClick={addGroup} className="add-btn">+ Add {field.label}</button>
    </div>
  );
};

const App = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const isPreview = step === schema.length;

  const handleChange = (name, value) => {
    const keys = name.split('.');
    if (keys.length === 1) {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      const [path, index, key] = keys;
      const updated = { ...(formData[path] || []) };
      updated[index] = { ...(updated[index] || {}), [key]: value };
      setFormData(prev => ({ ...prev, [path]: Object.values(updated) }));
    }
  };

  const validateStep = () => {
    const fields = schema[step].fields;
    let valid = true;
    let errors = [];

    const validateField = (field, val) => {
      if (field.required && (val === undefined || val === '' || val === null)) {
        valid = false;
        errors.push(`${field.label} is required`);
      }
    };

    fields.forEach(field => {
      if (field.type === 'repeatable') {
        const items = formData[field.name] || [];
        items.forEach(item => {
          field.fields.forEach(sub => validateField(sub, item[sub.name]));
        });
      } else {
        validateField(field, formData[field.name]);
      }
    });

    if (!valid) alert(errors.join('\n'));
    return valid;
  };

  const onNext = () => {
    if (!validateStep()) return;
    setStep(prev => prev + 1);
  };

  const onBack = () => setStep(prev => prev - 1);

  const onSubmit = () => {
    alert(JSON.stringify(formData, null, 2));
  };

  return (
    <div className="container">
      <h2>{isPreview ? 'Review Your Submission' : schema[step].title}</h2>
      <form onSubmit={(e) => { e.preventDefault(); isPreview ? onSubmit() : onNext(); }}>
        {!isPreview ? (
          <>
            {schema[step].fields.map((field, idx) => (
              field.type === 'repeatable' ? (
                <RepeatableFieldGroup key={idx} field={field} data={formData} onChange={handleChange} />
              ) : (
                <div key={idx} className="field-group">
                  <label>{field.label}</label>
                  {renderField(field, formData[field.name], handleChange)}
                </div>
              )
            ))}
          </>
        ) : (
          <div className="preview-box">{JSON.stringify(formData, null, 2)}</div>
        )}

        <div className="button-row">
          {step > 0 && (
            <button type="button" onClick={onBack} className="back-btn">Back</button>
          )}
          <button type="submit">
            {isPreview ? 'Submit' : step === schema.length - 1 ? 'Review' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default App;
