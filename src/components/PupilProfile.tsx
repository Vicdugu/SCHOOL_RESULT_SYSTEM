import React from 'react';
import './PupilProfile.css';

interface PupilProfileProps {
  name: string;
  sex: string;
  registrationNumber: string;
  onClose: () => void;
  onUpdate: (field: 'name' | 'sex' | 'registrationNumber', value: string) => void;
}

const PupilProfile: React.FC<PupilProfileProps> = ({
  name,
  sex,
  registrationNumber,
  onClose,
  onUpdate
}) => {
  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>Student Profile</h2>
          <button className="profile-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-content">
          <div className="profile-field">
            <label htmlFor="pupil-name">Student Name:</label>
            <input
              id="pupil-name"
              type="text"
              value={name}
              onChange={(e) => onUpdate('name', e.target.value)}
              placeholder="Enter student name"
              className="profile-input"
            />
          </div>

          <div className="profile-field">
            <label htmlFor="pupil-sex">Sex:</label>
            <select
              id="pupil-sex"
              value={sex}
              onChange={(e) => onUpdate('sex', e.target.value)}
              className="profile-select"
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="profile-field">
            <label htmlFor="pupil-reg">Registration Number:</label>
            <div className="reg-number-input-group">
              <span className="reg-prefix">S25/UBF/0</span>
              <input
                id="pupil-reg"
                type="text"
                value={(registrationNumber || '').replace('S25/UBF/0', '')}
                onChange={(e) => onUpdate('registrationNumber', 'S25/UBF/0' + e.target.value)}
                placeholder="000"
                className="profile-input reg-suffix-input"
              />
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="profile-close-action-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PupilProfile;
