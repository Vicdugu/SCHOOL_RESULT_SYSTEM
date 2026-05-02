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

  // Filter pupils with names
  const pupilsWithNames = pupils.filter(p => p.name.trim() !== '');

  if (pupilsWithNames.length === 0) {
    return null; // Don't show table if no pupils have names
  }

  return (
    <div className="observations-container">
      <h3 className="observations-title">Affective & Psychomotor Observations (Behavioral & Physical Abilities)</h3>
      
      {/* Row 1: Classroom and Psychological side by side */}
      <div className="observations-row">
        {['Classroom', 'Psychological'].map(category => (
          <div key={category} className="category-section category-col">
            <h4 className="category-name">{category}</h4>
            <div className="observations-wrapper">
              <table className="observations-table">
                <thead>
                  <tr>
                    <th className="attribute-name-col">Attribute</th>
                    {pupilsWithNames.map(pupil => (
                      <th key={pupil.id} className="pupil-col">
                        {pupil.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ATTRIBUTES[category as keyof typeof ATTRIBUTES].map(attribute => (
                    <tr key={attribute}>
                      <td className="attribute-name-col">{attribute}</td>
                      {pupilsWithNames.map(pupil => {
                        const value = pupil.observations?.[attribute] || 0;
                        return (
                          <td key={`${pupil.id}-${attribute}`} className="rating-cell">
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
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Social and Physical side by side */}
      <div className="observations-row">
        {['Social', 'Physical'].map(category => (
          <div key={category} className="category-section category-col">
            <h4 className="category-name">{category}</h4>
            <div className="observations-wrapper">
              <table className="observations-table">
                <thead>
                  <tr>
                    <th className="attribute-name-col">Attribute</th>
                    {pupilsWithNames.map(pupil => (
                      <th key={pupil.id} className="pupil-col">
                        {pupil.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ATTRIBUTES[category as keyof typeof ATTRIBUTES].map(attribute => (
                    <tr key={attribute}>
                      <td className="attribute-name-col">{attribute}</td>
                      {pupilsWithNames.map(pupil => {
                        const value = pupil.observations?.[attribute] || 0;
                        return (
                          <td key={`${pupil.id}-${attribute}`} className="rating-cell">
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
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
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
