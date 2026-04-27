import React, { useState } from 'react';
import './ExportOptionsModal.css';

interface PupilOption {
  id: string;
  name: string;
}

interface ExportOptionsModalProps {
  isOpen: boolean;
  pupils: PupilOption[];
  onExportWholeClass: () => void;
  onExportStudent: (studentId: string) => void;
  onCancel: () => void;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  pupils,
  onExportWholeClass,
  onExportStudent,
  onCancel,
}) => {
  const [exportMode, setExportMode] = useState<'class' | 'student' | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const pupilsWithNames = pupils.filter(p => p.name.trim() !== '');

  const handleExport = () => {
    if (exportMode === 'class') {
      onExportWholeClass();
    } else if (exportMode === 'student' && selectedStudentId) {
      onExportStudent(selectedStudentId);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay" onClick={onCancel}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2>Export Results</h2>
          <button className="export-modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="export-modal-content">
          <div className="export-options">
            <label className={`export-option-button ${exportMode === 'class' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="exportMode"
                value="class"
                checked={exportMode === 'class'}
                onChange={() => {
                  setExportMode('class');
                  setSelectedStudentId('');
                }}
              />
              <span className="option-text">📋 Export Whole Class</span>
            </label>

            <label className={`export-option-button ${exportMode === 'student' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="exportMode"
                value="student"
                checked={exportMode === 'student'}
                onChange={() => setExportMode('student')}
              />
              <span className="option-text">👤 Export Single Student</span>
            </label>
          </div>

          {exportMode === 'student' && (
            <div className="student-selector">
              <label htmlFor="student-select">Select Student:</label>
              <select
                id="student-select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="student-dropdown"
              >
                <option value="">-- Choose a student --</option>
                {pupilsWithNames.map((pupil) => (
                  <option key={pupil.id} value={pupil.id}>
                    {pupil.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {exportMode === null && (
            <p className="info-text">👇 Select an export option above</p>
          )}

          {exportMode === 'student' && pupilsWithNames.length === 0 && (
            <p className="warning-text">⚠️ No students with names found. Please add student names first.</p>
          )}

          {exportMode === 'student' && pupilsWithNames.length > 0 && !selectedStudentId && (
            <p className="info-text">👆 Select a student from the dropdown</p>
          )}
        </div>

        <div className="export-modal-footer">
          <button className="export-btn cancel-export-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="export-btn apply-export-btn"
            onClick={handleExport}
            disabled={
              exportMode === null ||
              (exportMode === 'student' && !selectedStudentId)
            }
          >
            📥 Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsModal;
