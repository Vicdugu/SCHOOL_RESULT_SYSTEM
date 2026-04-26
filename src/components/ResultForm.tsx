import React, { useState } from 'react';
import './ResultForm.css';

interface ResultFormProps {
  onSubmit: (pupilName: string) => void;
}

const ResultForm: React.FC<ResultFormProps> = ({ onSubmit }) => {
  const [pupilName, setPupilName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pupilName.trim()) {
      onSubmit(pupilName);
      setPupilName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="result-form">
      <div className="form-group">
        <label htmlFor="pupilName">Pupil Name</label>
        <input
          id="pupilName"
          type="text"
          value={pupilName}
          onChange={(e) => setPupilName(e.target.value)}
          placeholder="Enter pupil name"
        />
      </div>
      <button type="submit" className="submit-btn">
        Add Pupil
      </button>
    </form>
  );
};

export default ResultForm;
