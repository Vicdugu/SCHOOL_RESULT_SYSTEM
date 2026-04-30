import React from 'react';
import './ObservationsTable.css';

interface PupilObservations {
  [key: string]: number; // attribute name -> value (1-5)
}

interface ObservationsTableProps {
  pupils: Array<{ id: string; name: string; observations: PupilObservations }>;
  onObservationChange: (pupilId: string, attribute: string, value: number) => void;
}

const ATTRIBUTES = {
  'Classroom': ['Punctuality', 'Attendance', 'Participation', 'Attitude to work', 'Attentiveness', 'Assignments', 'Handwriting'],
  'Psychological': ['Emotional stability', 'Initiative/Creativity', 'Self-Control', 'Sense of Responsibility', 'Relationship with Students', 'Relationship with Staff', 'Leadership Trait'],
  'Social': ['Neatness', 'Politeness', 'Honesty', 'Verbal Fluency'],
  'Physical': ['Physical Health', 'Games & Sports', 'Dexterity']
};

const RATING_KEYS = {
  5: 'Excellent',
  4: 'Very good',
  3: 'Good',
  2: 'Weak',
  1: 'Can do better'
};

const ObservationsTable: React.FC<ObservationsTableProps> = ({ pupils = [], onObservationChange }) => {
  // Ensure ATTRIBUTES is defined
  if (!ATTRIBUTES) {
    return <div>Error: Attributes not loaded</div>;
  }

  // Get max number of attributes in any category for consistent table sizing
  const attributeValues = Object.values(ATTRIBUTES);
  const maxAttributesInCategory = attributeValues.length > 0 ? Math.max(...attributeValues.map(attrs => attrs.length)) : 0;

  if (maxAttributesInCategory === 0) {
    return <div>Error: No attributes found</div>;
  }

  return (
    <div className="observations-container">
      <h3 className="observations-title">Affective & Psychomotor Observations (Behavioral & Physical Abilities)</h3>
      
      <div className="observations-wrapper">
        <table className="observations-table">
          <thead>
            <tr>
              <th className="pupil-name-col">Pupil Name</th>
              {Object.entries(ATTRIBUTES).map(([category]) => (
                <th key={category} colSpan={maxAttributesInCategory} className="category-header">
                  {category}
                </th>
              ))}
            </tr>
            <tr>
              <th className="pupil-name-col"></th>
              {Object.entries(ATTRIBUTES).map(([category, attributes]) => (
                <React.Fragment key={category}>
                  {Array.from({ length: maxAttributesInCategory }).map((_, idx) => (
                    <th key={`${category}-${idx}`} className="attribute-col">
                      {attributes[idx] || ''}
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {pupils.filter(p => p.name.trim() !== '').map(pupil => (
              <tr key={pupil.id}>
                <td className="pupil-name-col">
                  <span className="pupil-name">{pupil.name}</span>
                </td>
                {Object.entries(ATTRIBUTES).map(([category, attributes]) => (
                  <React.Fragment key={category}>
                    {Array.from({ length: maxAttributesInCategory }).map((_, idx) => {
                      const attribute = attributes[idx];
                      const value = attribute ? (pupil.observations[attribute] || 0) : 0;
                      
                      return (
                        <td key={`${pupil.id}-${attribute}`} className="rating-cell">
                          {attribute && (
                            <select
                              value={value}
                              onChange={(e) => onObservationChange(pupil.id, attribute, Number(e.target.value))}
                              className="rating-select"
                              title={`${attribute}: Select rating`}
                            >
                              <option value={0}>-</option>
                              <option value={5}>5</option>
                              <option value={4}>4</option>
                              <option value={3}>3</option>
                              <option value={2}>2</option>
                              <option value={1}>1</option>
                            </select>
                          )}
                        </td>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rating-legend">
        <h4>Rating Scale:</h4>
        <div className="legend-items">
          {Object.entries(RATING_KEYS).reverse().map(([key, value]) => (
            <div key={key} className="legend-item">
              <span className="legend-key">{key}</span>
              <span className="legend-value">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ObservationsTable;
