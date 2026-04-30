import React, { useState, useEffect } from 'react';
import ResultsTable from './ResultsTable';
import ObservationsTable from './ObservationsTable';
import PupilProfile from './PupilProfile';
import ExportOptionsModal from './ExportOptionsModal';
import './ResultTabContent.css';

interface PupilResult {
  id: string;
  name: string;
  sex: string;
  registrationNumber: string;
  subjects: SubjectResult[];
  observations: { [key: string]: number };
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

interface ResultTabContentProps {
  classId: number;
  className: string;
  activeSubject: number;
  setActiveSubject: (index: number) => void;
  subjects: string[];
  setSubjects: (subjects: string[]) => void;
}

const DEFAULT_SUBJECTS = ['English', 'Mathematics', 'Science', 'History', 'Geography', 'Civic Studies', 'Physical Education'];
const INITIAL_PUPILS = 10;
const MANAGE_SUBJECTS_INDEX = -1;

const ResultTabContent: React.FC<ResultTabContentProps> = ({ 
  classId, 
  className,
  activeSubject: propActiveSubject,
  setActiveSubject: setPropsActiveSubject,
  subjects: propSubjects,
  setSubjects: setPropsSubjects
}) => {
  const [selectedPupilId, setSelectedPupilId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // New attendance and signature fields
  const [daysSchoolOpened, setDaysSchoolOpened] = useState<number>(0);
  const [daysInAttendance, setDaysInAttendance] = useState<number>(0);
  const [nextTermBegins, setNextTermBegins] = useState<string>('');
  const [classTeacherComment, setClassTeacherComment] = useState<string>('');
  const [headTeacherComment, setHeadTeacherComment] = useState<string>('');
  
  // Use props or fallback to local state
  const activeSubject = propActiveSubject !== undefined ? propActiveSubject : 0;
  const setActiveSubject = setPropsActiveSubject || (() => {});
  
  // Local subjects state - initialize from props or localStorage
  const [localSubjects, setLocalSubjects] = useState<string[]>(() => {
    if (propSubjects && propSubjects.length > 0) {
      return propSubjects;
    }
    const savedSubjects = localStorage.getItem(`class-${classId}-subjects`);
    return savedSubjects ? JSON.parse(savedSubjects) : DEFAULT_SUBJECTS;
  });
  
  const subjects = localSubjects;
  const setSubjects = (newSubjects: string[]) => {
    setLocalSubjects(newSubjects);
    if (setPropsSubjects) {
      setPropsSubjects(newSubjects);
    }
    // Save to localStorage immediately
    localStorage.setItem(`class-${classId}-subjects`, JSON.stringify(newSubjects));
  };
  
  // Initialize pupils from localStorage
  const [pupils, setPupils] = useState<PupilResult[]>(() => {
    const stored = localStorage.getItem(`class-${classId}-results`);
    if (stored) {
      return JSON.parse(stored);
    }

    // Get saved subjects or use defaults
    const savedSubjects = localStorage.getItem(`class-${classId}-subjects`);
    const subjectsToUse = savedSubjects ? JSON.parse(savedSubjects) : DEFAULT_SUBJECTS;

    return Array.from({ length: INITIAL_PUPILS }, (_, i) => ({
      id: `pupil-${Date.now()}-${i}`,
      name: '',
      sex: '',
      registrationNumber: '',
      subjects: subjectsToUse.map((subject: string) => ({
        name: subject,
        ca1: 0,
        ca2: 0,
        exam: 0,
        total: 0,
        rank: 0
      })),
      observations: {}
    }));
  });

  // Reload pupils data when classId changes
  useEffect(() => {
    const stored = localStorage.getItem(`class-${classId}-results`);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPupils(JSON.parse(stored));
    } else {
      // Get saved subjects or use defaults
      const savedSubjects = localStorage.getItem(`class-${classId}-subjects`);
      const subjectsToUse = savedSubjects ? JSON.parse(savedSubjects) : DEFAULT_SUBJECTS;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPupils(Array.from({ length: INITIAL_PUPILS }, (_, i) => ({
        id: `pupil-${Date.now()}-${i}`,
        name: '',
        sex: '',
        registrationNumber: '',
        subjects: subjectsToUse.map((subject: string) => ({
          name: subject,
          ca1: 0,
          ca2: 0,
          exam: 0,
          total: 0,
          rank: 0
        })),
        observations: {}
      })));
    }
  }, [classId]);

  // Save to localStorage whenever pupils change
  useEffect(() => {
    localStorage.setItem(`class-${classId}-results`, JSON.stringify(pupils));
  }, [pupils, classId]);

  // Sync pupils' subjects with the subjects list whenever subjects change
  useEffect(() => {
    if (subjects.length === 0) return;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPupils(prevPupils => {
      // Check if sync is needed
      if (prevPupils.length === 0) return prevPupils;
      
      const needsSync = prevPupils[0].subjects.length !== subjects.length ||
        prevPupils[0].subjects.some((s, i) => s.name !== subjects[i]);
      
      if (!needsSync) return prevPupils;
      
      // Reconstruct pupils with new subjects structure
      return prevPupils.map(pupil => {
        const updatedSubjects = subjects.map((subjectName, index) => {
          // Preserve existing scores if subject name matches
          const existing = pupil.subjects.find(s => s.name === subjectName);
          if (existing) {
            return existing;
          }
          // Or if index exists, try to preserve by index
          if (index < pupil.subjects.length) {
            return {
              ...pupil.subjects[index],
              name: subjectName
            };
          }
          // Otherwise create new
          return {
            name: subjectName,
            ca1: 0,
            ca2: 0,
            exam: 0,
            total: 0,
            rank: 0
          };
        });
        
        return {
          ...pupil,
          subjects: updatedSubjects
        };
      });
    });
  }, [subjects]);

  // Calculate totals and rankings for the current subject
  const currentSubject = activeSubject >= 0 ? subjects[activeSubject] : '';
  const isManagingSubjects = activeSubject === MANAGE_SUBJECTS_INDEX;
  const calculateRankings = (subjectIndex: number, pupilist: PupilResult[] = pupils) => {
    const updatedPupils = pupilist.map(pupil => {
      return {
        ...pupil,
        subjects: pupil.subjects.map((s, i) => {
          if (i === subjectIndex) {
            return {
              ...s,
              total: s.ca1 + s.ca2 + s.exam
            };
          }
          return s;
        })
      };
    });

    // Calculate rankings based on totals
    const scores = updatedPupils.map(p => ({
      id: p.id,
      total: p.subjects[subjectIndex].total
    }));
    scores.sort((a, b) => b.total - a.total);

    return updatedPupils.map(pupil => ({
      ...pupil,
      subjects: pupil.subjects.map((s, i) => {
        if (i === subjectIndex) {
          const rank = scores.findIndex(score => score.id === pupil.id) + 1;
          return { ...s, rank };
        }
        return s;
      })
    }));
  };

  const handleScoreChange = (
    pupilId: string,
    subjectIndex: number,
    field: 'ca1' | 'ca2' | 'exam',
    value: number
  ) => {
    const updatedPupils = pupils.map(pupil => {
      if (pupil.id === pupilId) {
        return {
          ...pupil,
          subjects: pupil.subjects.map((subject, i) => {
            if (i === subjectIndex) {
              return { ...subject, [field]: value };
            }
            return subject;
          })
        };
      }
      return pupil;
    });

    const finalPupils = calculateRankings(subjectIndex, updatedPupils);
    setPupils(finalPupils);
  };

  const handleObservationChange = (pupilId: string, attribute: string, value: number) => {
    const updatedPupils = pupils.map(pupil => {
      if (pupil.id === pupilId) {
        return {
          ...pupil,
          observations: {
            ...pupil.observations,
            [attribute]: value
          }
        };
      }
      return pupil;
    });
    setPupils(updatedPupils);
  };

  const handlePupilNameChange = (pupilId: string, newName: string) => {
    const updatedPupils = pupils.map(pupil => {
      if (pupil.id === pupilId) {
        return { ...pupil, name: newName };
      }
      return pupil;
    });
    setPupils(updatedPupils);
  };

  const handleAddPupil = () => {
    const newPupil: PupilResult = {
      id: `pupil-${Date.now()}`,
      name: '',
      sex: '',
      registrationNumber: '',
      subjects: subjects.map(subject => ({
        name: subject,
        ca1: 0,
        ca2: 0,
        exam: 0,
        total: 0,
        rank: 0
      })),
      observations: {}
    };
    setPupils([...pupils, newPupil]);
  };

  const handleRemovePupil = (pupilId: string) => {
    const filteredPupils = pupils.filter(pupil => pupil.id !== pupilId);
    const finalPupils = calculateRankings(activeSubject, filteredPupils);
    setPupils(finalPupils);
  };

  const handleEditSubject = (index: number, newName: string) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = newName;
    
    // Update all pupils' subject names
    const updatedPupils = pupils.map(pupil => ({
      ...pupil,
      subjects: pupil.subjects.map((s, i) => i === index ? { ...s, name: newName } : s)
    }));
    
    setSubjects(updatedSubjects);
    setPupils(updatedPupils);
  };

  const handleAddSubject = () => {
    const newSubjectName = `Subject ${subjects.length + 1}`;
    
    // Add subject to list
    const updatedSubjects = [...subjects, newSubjectName];
    
    // Add subject to all pupils
    const updatedPupils = pupils.map(pupil => ({
      ...pupil,
      subjects: [
        ...pupil.subjects,
        {
          name: newSubjectName,
          ca1: 0,
          ca2: 0,
          exam: 0,
          total: 0,
          rank: 0
        }
      ]
    }));
    
    setSubjects(updatedSubjects);
    setPupils(updatedPupils);
  };

  const handleDeleteSubject = (index: number) => {
    if (subjects.length <= 1) {
      alert('You must have at least one subject');
      return;
    }

    const updatedSubjects = subjects.filter((_, i) => i !== index);
    
    // Remove subject from all pupils
    const updatedPupils = pupils.map(pupil => ({
      ...pupil,
      subjects: pupil.subjects.filter((_, i) => i !== index)
    }));
    
    // Adjust active subject if needed
    if (activeSubject >= updatedSubjects.length) {
      setActiveSubject(updatedSubjects.length - 1);
    }
    
    setSubjects(updatedSubjects);
    setPupils(updatedPupils);
  };

  const handleUpdateProfile = (pupilId: string, field: 'name' | 'sex' | 'registrationNumber', value: string) => {
    // Check for duplicate registration number
    if (field === 'registrationNumber' && value) {
      const isDuplicate = pupils.some(p => p.id !== pupilId && p.registrationNumber === value);
      
      if (isDuplicate) {
        // Extract the numeric part to suggest next number
        const numericMatch = value.match(/(\d+)$/);
        if (numericMatch) {
          const currentNum = parseInt(numericMatch[1], 10);
          const nextNum = currentNum + 1;
          const nextNumStr = String(nextNum).padStart(3, '0');
          const suggestedRegNo = 'S25/UBF/0' + nextNumStr;
          
          setToastMessage(`⚠️ Reg. No. ${value} already assigned! Try: ${suggestedRegNo}`);
          setTimeout(() => setToastMessage(''), 3500);
          return; // Don't update if duplicate
        }
      }
    }

    const updatedPupils = pupils.map(pupil => {
      if (pupil.id === pupilId) {
        return { ...pupil, [field]: value };
      }
      return pupil;
    });

    // Auto-increment registration number for the next empty student
    if (field === 'registrationNumber' && value) {
      const currentPupilIndex = updatedPupils.findIndex(p => p.id === pupilId);
      
      // Extract the numeric part from registration number
      const numericMatch = value.match(/(\d+)$/);
      if (numericMatch) {
        const currentNum = parseInt(numericMatch[1], 10);
        const nextNum = currentNum + 1;
        const nextNumStr = String(nextNum).padStart(3, '0'); // Pad to 3 digits
        
        // Find the next pupil with empty registration number
        const nextEmptyIndex = updatedPupils.findIndex((p, idx) => 
          idx > currentPupilIndex && !p.registrationNumber
        );
        
        if (nextEmptyIndex !== -1) {
          updatedPupils[nextEmptyIndex] = {
            ...updatedPupils[nextEmptyIndex],
            registrationNumber: 'S25/UBF/0' + nextNumStr
          };
        }
      }
    }

    setPupils(updatedPupils);
  };

  const handleSaveSubjects = () => {
    setSaveMessage('✓ Subjects saved successfully!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const selectedPupil = pupils.find(p => p.id === selectedPupilId);

  const handleExport = () => {
    // Open export options modal
    setIsExportModalOpen(true);
  };

  const handleExportWholeClass = async () => {
    try {
      // Find pupils with names to export
      const pupilsToExport = pupils.filter(p => p.name.trim() !== '');
      
      if (pupilsToExport.length === 0) {
        alert('Please enter pupil names before exporting');
        return;
      }

      // Get school info including logo
      const schoolInfoStr = localStorage.getItem('school-info');
      const schoolInfo = schoolInfoStr ? JSON.parse(schoolInfoStr) : {};

      // Calculate class statistics
      const classAverage = pupilsToExport.length > 0
        ? pupilsToExport.reduce((sum, p) => {
            const pupilAvg = p.subjects.length > 0 ? p.subjects.reduce((s, subj) => s + subj.total, 0) / p.subjects.length : 0;
            return sum + pupilAvg;
          }, 0) / pupilsToExport.length
        : 0;

      // Import the export function
      const { exportPupilResult } = await import('../utils/wordExport');

      // Export each pupil's result sheet
      for (const pupil of pupilsToExport) {
        const pupilData = {
          id: pupil.id,
          name: pupil.name,
          registrationNumber: pupil.registrationNumber,
          sex: pupil.sex,
          subjects: pupil.subjects.map(s => ({
            name: s.name,
            ca1: s.ca1,
            ca2: s.ca2,
            exam: s.exam,
            total: s.total,
            rank: s.rank
          })),
          observations: pupil.observations,
          classTeacherComment: classTeacherComment,
          headTeacherComment: headTeacherComment
        };

        const exportOptions = {
          className: className,
          schoolName: schoolInfo.name || 'School Result Management System',
          schoolAddress: schoolInfo.address || 'School Address',
          schoolLogo: schoolInfo.logo,
          term: 'First Term',
          academicYear: '2025/2026',
          totalStudentsInClass: pupilsToExport.length,
          classAverage: classAverage,
          daysSchoolOpened: daysSchoolOpened,
          daysInAttendance: daysInAttendance,
          nextTermBegins: nextTermBegins,
          classTeacher: schoolInfo.classTeacher || ''
        };

        await exportPupilResult(pupilData, exportOptions);
        
        // Add a small delay between exports to prevent browser issues
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setIsExportModalOpen(false);
      alert(`Successfully exported ${pupilsToExport.length} pupil(s) result sheet(s)`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting results. Please try again.');
    }
  };

  const handleExportStudent = async (studentId: string) => {
    try {
      const studentToExport = pupils.find(p => p.id === studentId);
      
      if (!studentToExport || !studentToExport.name.trim()) {
        alert('Student not found or has no name');
        return;
      }

      // Get school info including logo
      const schoolInfoStr = localStorage.getItem('school-info');
      const schoolInfo = schoolInfoStr ? JSON.parse(schoolInfoStr) : {};

      // Calculate class average (from students with names)
      const pupilsWithNames = pupils.filter(p => p.name.trim() !== '');
      const classAverage = pupilsWithNames.length > 0
        ? pupilsWithNames.reduce((sum, p) => {
            const pupilAvg = p.subjects.length > 0 ? p.subjects.reduce((s, subj) => s + subj.total, 0) / p.subjects.length : 0;
            return sum + pupilAvg;
          }, 0) / pupilsWithNames.length
        : 0;

      // Import the export function
      const { exportPupilResult } = await import('../utils/wordExport');

      const pupilData = {
        id: studentToExport.id,
        name: studentToExport.name,
        registrationNumber: studentToExport.registrationNumber,
        sex: studentToExport.sex,
        subjects: studentToExport.subjects.map(s => ({
          name: s.name,
          ca1: s.ca1,
          ca2: s.ca2,
          exam: s.exam,
          total: s.total,
          rank: s.rank
        })),
        observations: studentToExport.observations,
        classTeacherComment: classTeacherComment,
        headTeacherComment: headTeacherComment
      };

      const exportOptions = {
        className: className,
        schoolName: schoolInfo.name || 'School Result Management System',
        schoolAddress: schoolInfo.address || 'School Address',
        schoolLogo: schoolInfo.logo,
        term: 'First Term',
        academicYear: '2025/2026',
        totalStudentsInClass: pupilsWithNames.length,
        classAverage: classAverage,
        daysSchoolOpened: daysSchoolOpened,
        daysInAttendance: daysInAttendance,
        nextTermBegins: nextTermBegins,
        classTeacher: schoolInfo.classTeacher || ''
      };

      await exportPupilResult(pupilData, exportOptions);
      
      setIsExportModalOpen(false);
      alert(`Successfully exported ${studentToExport.name}'s result sheet`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting results. Please try again.');
    }
  };

  return (
    <>
      <ExportOptionsModal
        isOpen={isExportModalOpen}
        pupils={pupils.map(p => ({ id: p.id, name: p.name }))}
        onExportWholeClass={handleExportWholeClass}
        onExportStudent={handleExportStudent}
        onCancel={() => setIsExportModalOpen(false)}
      />
      <div className="result-tab-content">
        <div className="content-header">
          <h2>{className} - Results Entry</h2>
          <button onClick={handleExport} className="export-btn">
            📥 Export to Word
          </button>
        </div>

      {isManagingSubjects ? (
        <div className="subject-management">
          <h3>Manage Subjects:</h3>
          <div className="subject-list">
            {subjects.map((subject, index) => (
              <div key={index} className="subject-item">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => handleEditSubject(index, e.target.value)}
                  className="subject-input"
                  placeholder="Subject name"
                />
                {subjects.length > 1 && (
                  <button
                    onClick={() => handleDeleteSubject(index)}
                    className="delete-subject-btn"
                    title="Delete subject"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="subject-actions">
            <button onClick={handleAddSubject} className="add-subject-btn">
              ➕ Add Subject
            </button>
            <button onClick={handleSaveSubjects} className="save-subject-btn">
              💾 Save Subjects
            </button>
          </div>
          {saveMessage && <div className="save-message">{saveMessage}</div>}
        </div>
      ) : (
        <div className="result-display">
          <ResultsTable
            pupils={pupils}
            subjectIndex={activeSubject}
            onScoreChange={handleScoreChange}
            onPupilNameChange={handlePupilNameChange}
            onRemovePupil={handleRemovePupil}
            onProfileClick={setSelectedPupilId}
            subject={currentSubject}
          />
          <div className="add-pupil-section">
            <button onClick={handleAddPupil} className="add-pupil-btn">
              ➕ Add Pupil Row
            </button>
          </div>
          <ObservationsTable
            pupils={pupils.map(p => ({
              id: p.id,
              name: p.name,
              observations: p.observations || {}
            }))}
            onObservationChange={handleObservationChange}
          />
          
          {/* Attendance and Signature Section */}
          <div className="attendance-signature-section">
            <h3>Attendance & Signature Information</h3>
            <div className="attendance-grid">
              <div className="attendance-field">
                <label>Number of days school was opened:</label>
                <input
                  type="number"
                  value={daysSchoolOpened}
                  onChange={(e) => setDaysSchoolOpened(Number(e.target.value))}
                  placeholder="e.g., 190"
                  min="0"
                />
              </div>
              <div className="attendance-field">
                <label>Number of days in attendance:</label>
                <input
                  type="number"
                  value={daysInAttendance}
                  onChange={(e) => setDaysInAttendance(Number(e.target.value))}
                  placeholder="e.g., 180"
                  min="0"
                />
              </div>
            </div>
            <div className="attendance-field">
              <label>Next term begins on:</label>
              <input
                type="date"
                value={nextTermBegins}
                onChange={(e) => setNextTermBegins(e.target.value)}
              />
            </div>
            <div className="signature-grid">
              <div className="signature-field">
                <label>Class Teacher Comment:</label>
                <textarea
                  value={classTeacherComment}
                  onChange={(e) => setClassTeacherComment(e.target.value)}
                  placeholder="Enter class teacher comment"
                  rows={2}
                />
              </div>
              <div className="signature-field">
                <label>Head Teacher Comment:</label>
                <textarea
                  value={headTeacherComment}
                  onChange={(e) => setHeadTeacherComment(e.target.value)}
                  placeholder="Enter head teacher comment"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedPupil && (
        <PupilProfile
          name={selectedPupil.name}
          sex={selectedPupil.sex}
          registrationNumber={selectedPupil.registrationNumber}
          onClose={() => setSelectedPupilId(null)}
          onUpdate={(field, value) => handleUpdateProfile(selectedPupil.id, field, value)}
        />
      )}
      {toastMessage && <div className="toast-notification">{toastMessage}</div>}
      </div>
    </>
  );
};

export default ResultTabContent;
