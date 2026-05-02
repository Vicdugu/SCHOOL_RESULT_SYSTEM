import React, { useState } from 'react';
import './ResultsTable.css';

interface PupilResult {
  id: string;
  name: string;
  sex: string;
  registrationNumber: string;
  subjects: SubjectResult[];
}

interface SubjectResult {
  name: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number;
  rank: number;
  remark?: string;
}

interface ResultsTableProps {
  pupils: PupilResult[];
  subjectIndex: number;
  subject: string;
  onScoreChange: (pupilId: string, subjectIndex: number, field: 'ca1' | 'ca2' | 'exam', value: number) => void;
  onPupilNameChange: (pupilId: string, newName: string) => void;
  onRemovePupil: (pupilId: string) => void;
  onProfileClick: (pupilId: string) => void;
}

type SortBy = 'default' | 'position' | 'name';
type SortOrder = 'asc' | 'desc';

const ResultsTable: React.FC<ResultsTableProps> = ({ pupils, subjectIndex, subject, onScoreChange, onPupilNameChange, onRemovePupil, onProfileClick }) => {
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedPupilId, setExpandedPupilId] = useState<string | null>(null);

  const getSortedPupils = () => {
    const pupilsCopy = [...pupils];

    if (sortBy === 'position') {
      // Sort by position (highest to lowest)
      pupilsCopy.sort((a, b) => {
        const rankA = a.subjects[subjectIndex]?.rank || Infinity;
        const rankB = b.subjects[subjectIndex]?.rank || Infinity;
        return rankA - rankB; // Lowest rank number (1st, 2nd, 3rd) comes first
      });
    } else if (sortBy === 'name') {
      // Sort by name (alphabetically)
      pupilsCopy.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    }

    return pupilsCopy;
  };

  const handlePositionSort = () => {
    if (sortBy === 'position') {
      // If already sorting by position, toggle order (but position is always highest to lowest)
      setSortBy('default');
    } else {
      setSortBy('position');
      setSortOrder('asc');
    }
  };

  const handleNameSort = () => {
    if (sortBy === 'name') {
      // Toggle between A-Z and Z-A
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy('name');
      setSortOrder('asc');
    }
  };

  const isScoreEntered = (ca1: number, ca2: number, exam: number): boolean => {
    return ca1 > 0 || ca2 > 0 || exam > 0;
  };

  const calculateGrade = (total: number, ca1: number, ca2: number, exam: number): string => {
    if (!isScoreEntered(ca1, ca2, exam)) return '';
    if (total >= 70) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 45) return 'D';
    if (total >= 40) return 'E';
    return 'F';
  };

  const calculateRemark = (total: number, ca1: number, ca2: number, exam: number): string => {
    if (!isScoreEntered(ca1, ca2, exam)) return '';
    const grade = calculateGrade(total, ca1, ca2, exam);
    switch (grade) {
      case 'A':
        return 'Exceptional';
      case 'B':
        return 'Very good';
      case 'C':
        return 'Good';
      case 'D':
        return 'Satisfactory';
      case 'E':
        return 'Needs improvement';
      case 'F':
        return 'Unsatisfactory';
      default:
        return '';
    }
  };

  const handleArrowKeyScore = (pupilId: string, subjectIndex: number, field: 'ca1' | 'ca2' | 'exam', direction: 'up' | 'down', currentValue: number) => {
    const maxValues = { ca1: 20, ca2: 20, exam: 60 };
    const max = maxValues[field];
    let newValue = currentValue;
    
    if (direction === 'up') {
      newValue = Math.min(newValue + 1, max);
    } else {
      newValue = Math.max(newValue - 1, 0);
    }
    
    onScoreChange(pupilId, subjectIndex, field, newValue);
  };

  const sortedPupils = getSortedPupils();

  return (
    <div className="results-table-wrapper">
      <h3 className="subject-title">{subject}</h3>
      <table className="results-table">
        <thead>
          <tr>
            <th className="action-col">Profile</th>
            <th className="serial-col">S/N</th>
            <th className="name-col sort-header" onClick={handleNameSort} title="Click to sort by name">
              <span className="header-content">
                Pupil Name
                {sortBy === 'name' && (
                  <span className="sort-indicator">{sortOrder === 'asc' ? ' ▲ A-Z' : ' ▼ Z-A'}</span>
                )}
              </span>
            </th>
            <th className="score-col">CA1 (20)</th>
            <th className="score-col">CA2 (20)</th>
            <th className="score-col">Exam (60)</th>
            <th className="total-col">Total (100)</th>
            <th className="grade-col">Grade</th>
            <th className="rank-col sort-header" onClick={handlePositionSort} title="Click to sort by position">
              <span className="header-content">
                Position
                {sortBy === 'position' && <span className="sort-indicator"> ▼ High→Low</span>}
              </span>
            </th>
            <th className="remark-col">Remark</th>
            <th className="action-col">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedPupils.map((pupil, index) => {
            const subject_data = pupil.subjects[subjectIndex];
            
            // Safety check: if subject data doesn't exist, show loading/syncing message
            if (!subject_data) {
              return (
                <tr key={pupil.id} className="loading-row">
                  <td colSpan={8} className="loading-message">
                    ⏳ Syncing subject data... Please wait.
                  </td>
                </tr>
              );
            }

            const hasScore = isScoreEntered(subject_data.ca1, subject_data.ca2, subject_data.exam);
            
            return (
              <tr key={pupil.id} className={hasScore && subject_data.rank === 1 ? 'top-score' : ''}>
                <td className="action-col">
                  <button
                    onClick={() => onProfileClick(pupil.id)}
                    className="profile-btn"
                    title="Edit student profile"
                  >
                    👤
                  </button>
                </td>
                <td className="serial-col">
                  <span className="serial-number">{index + 1}</span>
                </td>
                <td className="name-col">
                  <input
                    type="text"
                    value={pupil.name}
                    onChange={(e) => onPupilNameChange(pupil.id, e.target.value)}
                    placeholder="Enter pupil name"
                    className="name-input"
                  />
                </td>
                <td className="score-col">
                  <div className="score-input-wrapper">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={subject_data.ca1 === 0 ? '' : subject_data.ca1}
                      placeholder="-"
                      onChange={(e) =>
                        onScoreChange(pupil.id, subjectIndex, 'ca1', e.target.value === '' ? 0 : Math.min(20, Math.max(0, Number(e.target.value))))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          handleArrowKeyScore(pupil.id, subjectIndex, 'ca1', 'up', subject_data.ca1);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          handleArrowKeyScore(pupil.id, subjectIndex, 'ca1', 'down', subject_data.ca1);
                        }
                      }}
                      className="score-input"
                    />
                    <div className="arrow-buttons">
                      <button
                        className="arrow-btn up-btn"
                        onClick={() => handleArrowKeyScore(pupil.id, subjectIndex, 'ca1', 'up', subject_data.ca1)}
                        title="Increase CA1"
                      >
                        ▲
                      </button>
                      <button
                        className="arrow-btn down-btn"
                        onClick={() => handleArrowKeyScore(pupil.id, subjectIndex, 'ca1', 'down', subject_data.ca1)}
                        title="Decrease CA1"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </td>
                <td className="score-col">
                  <div className="score-input-wrapper">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={subject_data.ca2 === 0 ? '' : subject_data.ca2}
                      placeholder="-"
                      onChange={(e) =>
                        onScoreChange(pupil.id, subjectIndex, 'ca2', e.target.value === '' ? 0 : Math.min(20, Math.max(0, Number(e.target.value))))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          handleArrowKeyScore(pupil.id, subjectIndex, 'ca2', 'up', subject_data.ca2);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          handleArrowKeyScore(pupil.id, subjectIndex, 'ca2', 'down', subject_data.ca2);
                        }
                      }}
                      className="score-input"
                    />
                    <div className="arrow-buttons">
                      <button
                        className="arrow-btn up-btn"
                        onClick={() => handleArrowKeyScore(pupil.id, subjectIndex, 'ca2', 'up', subject_data.ca2)}
                        title="Increase CA2"
                      >
                        ▲
                      </button>
                      <button
                        className="arrow-btn down-btn"
                        onClick={() => handleArrowKeyScore(pupil.id, subjectIndex, 'ca2', 'down', subject_data.ca2)}
                        title="Decrease CA2"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </td>
                <td className="score-col">
                  <div className="score-input-wrapper">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={subject_data.exam === 0 ? '' : subject_data.exam}
                      placeholder="-"
                      onChange={(e) =>
                        onScoreChange(pupil.id, subjectIndex, 'exam', e.target.value === '' ? 0 : Math.min(60, Math.max(0, Number(e.target.value))))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          handleArrowKeyScore(pupil.id, subjectIndex, 'exam', 'up', subject_data.exam);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          handleArrowKeyScore(pupil.id, subjectIndex, 'exam', 'down', subject_data.exam);
                        }
                      }}
                      className="score-input"
                    />
                    <div className="arrow-buttons">
                      <button
                        className="arrow-btn up-btn"
                        onClick={() => handleArrowKeyScore(pupil.id, subjectIndex, 'exam', 'up', subject_data.exam)}
                        title="Increase Exam"
                      >
                        ▲
                      </button>
                      <button
                        className="arrow-btn down-btn"
                        onClick={() => handleArrowKeyScore(pupil.id, subjectIndex, 'exam', 'down', subject_data.exam)}
                        title="Decrease Exam"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </td>
                <td className="total-col">
                  <span className="total-value">{isScoreEntered(subject_data.ca1, subject_data.ca2, subject_data.exam) ? subject_data.total : '-'}</span>
                </td>
                <td className="grade-col">
                  {isScoreEntered(subject_data.ca1, subject_data.ca2, subject_data.exam) ? (
                    <span className={`grade-badge grade-${calculateGrade(subject_data.total, subject_data.ca1, subject_data.ca2, subject_data.exam).toLowerCase()}`}>
                      {calculateGrade(subject_data.total, subject_data.ca1, subject_data.ca2, subject_data.exam)}
                    </span>
                  ) : (
                    <span className="grade-badge">-</span>
                  )}
                </td>
                <td className="rank-col">
                  <span className={`rank-badge ${subject_data.rank === 1 ? 'first' : subject_data.rank === 2 ? 'second' : subject_data.rank === 3 ? 'third' : ''}`}>
                    {isScoreEntered(subject_data.ca1, subject_data.ca2, subject_data.exam) ? (subject_data.rank || '-') : '-'}
                  </span>
                </td>
                <td className="remark-col">
                  <span className="remark-badge">{calculateRemark(subject_data.total, subject_data.ca1, subject_data.ca2, subject_data.exam) || '-'}</span>
                </td>
                <td className="action-col">
                  {expandedPupilId === pupil.id ? (
                    <button
                      onClick={() => {
                        onRemovePupil(pupil.id);
                        setExpandedPupilId(null);
                      }}
                      className="delete-btn visible"
                      title="Delete this pupil row"
                    >
                      ✕
                    </button>
                  ) : (
                    <button
                      onClick={() => setExpandedPupilId(pupil.id)}
                      className="action-toggle-btn"
                      title="Click to show delete button"
                    >
                      ⋮
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
