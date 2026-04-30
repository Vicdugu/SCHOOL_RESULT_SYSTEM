import React, { useState, useEffect } from 'react';
import ResultsTable from './ResultsTable';
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
  daysSchoolOpened?: number;
  daysInAttendance?: number;
  nextTermBegins?: string;
  classTeacherComment?: string;
  headTeacherComment?: string;
  classTeacherName?: string;
  headTeacherName?: string;
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
  userRole?: 'teacher' | 'admin';
}

const DEFAULT_SUBJECTS = ['English', 'Mathematics', 'Science', 'History', 'Geography', 'Civic Studies', 'Physical Education'];
const INITIAL_PUPILS = 10;
const MANAGE_SUBJECTS_INDEX = -1;

const HEAD_TEACHER_COMMENTS = [
  'Excellent result, please keep it up!',
  'Allahumma baarik!',
  'An outstanding result',
  'Satisfactory, you can do better next term.',
  'Increase your effort and attention to details.',
  'A reliable and hardworking student who consistently meets expectations.',
  'You have shown improvement in ......., but extra practice with …….. will help you master the material.',
  'You have grown in confidence this term, especially when speaking in front of the class.'
];

const ResultTabContent: React.FC<ResultTabContentProps> = ({ 
  classId, 
  className,
  activeSubject: propActiveSubject,
  setActiveSubject: setPropsActiveSubject,
  subjects: propSubjects,
  setSubjects: setPropsSubjects,
  userRole = 'teacher'
}) => {
  const [selectedPupilId, setSelectedPupilId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Student selected for editing behavior and attendance
  const [behaviorStudentId, setBehaviorStudentId] = useState<string | null>(null);
  
  // Temporary state for editing current student's behavior and attendance
  const [currentStudentObservations, setCurrentStudentObservations] = useState<{ [key: string]: number }>({});
  const [currentDaysSchoolOpened, setCurrentDaysSchoolOpened] = useState<number>(0);
  const [currentDaysInAttendance, setCurrentDaysInAttendance] = useState<number>(0);
  const [currentNextTermBegins, setCurrentNextTermBegins] = useState<string>('');
  const [currentClassTeacherComment, setCurrentClassTeacherComment] = useState<string>('');
  const [currentHeadTeacherComment, setCurrentHeadTeacherComment] = useState<string>('');
  const [currentClassTeacherName, setCurrentClassTeacherName] = useState<string>('');
  const [currentHeadTeacherName, setCurrentHeadTeacherName] = useState<string>('');
  
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

  // Listen for external changes to subjects in localStorage (e.g., from admin panel)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSubjects = localStorage.getItem(`class-${classId}-subjects`);
      if (savedSubjects) {
        const newSubjects = JSON.parse(savedSubjects);
        
        // Only update if subjects actually changed
        if (JSON.stringify(newSubjects) !== JSON.stringify(subjects)) {
          setSubjects(newSubjects);
        }
      }
    };

    // Check for updates every 200ms for faster response
    const interval = setInterval(handleStorageChange, 200);
    
    // Also listen for storage events (cross-tab updates)
    window.addEventListener('storage', handleStorageChange);
    
    // Check immediately when component mounts
    handleStorageChange();
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [classId, subjects]);

  // Calculate totals and rankings for the current subject
  const currentSubject = activeSubject >= 0 ? subjects[activeSubject] : '';
  const isManagingSubjects = userRole === 'admin' && activeSubject === MANAGE_SUBJECTS_INDEX;
  const calculateRankings = (subjectIndex: number, pupilist: PupilResult[] = pupils) => {
    // Safety check: ensure subjectIndex is valid
    if (subjectIndex < 0 || !pupilist[0] || subjectIndex >= pupilist[0].subjects.length) {
      return pupilist;
    }

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
      total: p.subjects[subjectIndex]?.total ?? 0
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
    // Safety check: ensure subjectIndex is valid
    if (subjectIndex < 0 || !pupils[0] || subjectIndex >= pupils[0].subjects.length) {
      return;
    }

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

  // Helper function to get all registration numbers from all classes
  const getAllRegistrationNumbers = (): string[] => {
    const allRegNumbers: string[] = [];
    
    // Check all classes (1-6)
    for (let classId = 1; classId <= 6; classId++) {
      const stored = localStorage.getItem(`class-${classId}-results`);
      if (stored) {
        try {
          const classPupils: PupilResult[] = JSON.parse(stored);
          classPupils.forEach(pupil => {
            if (pupil.registrationNumber) {
              allRegNumbers.push(pupil.registrationNumber);
            }
          });
        } catch (e) {
          console.error(`Error parsing class-${classId}-results`, e);
        }
      }
    }
    
    return allRegNumbers;
  };

  // Helper function to get the next available registration number
  const getNextRegistrationNumber = (): string => {
    const allRegNumbers = getAllRegistrationNumbers();
    
    // Extract all numeric parts and find the maximum
    let maxNum = 0;
    allRegNumbers.forEach(regNum => {
      const numericMatch = regNum.match(/(\d+)$/);
      if (numericMatch) {
        const num = parseInt(numericMatch[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    const nextNum = maxNum + 1;
    const nextNumStr = String(nextNum).padStart(3, '0');
    return `S25/UBF/0${nextNumStr}`;
  };

  const handleUpdateProfile = (pupilId: string, field: 'name' | 'sex' | 'registrationNumber', value: string) => {
    // Check for duplicate registration number across ALL classes
    if (field === 'registrationNumber' && value) {
      const allRegNumbers = getAllRegistrationNumbers();
      const isDuplicate = allRegNumbers.includes(value);
      
      if (isDuplicate) {
        // Get the next available registration number across all students
        const suggestedRegNo = getNextRegistrationNumber();
        setToastMessage(`⚠️ Reg. No. ${value} already assigned! Try: ${suggestedRegNo}`);
        setTimeout(() => setToastMessage(''), 3500);
        return; // Don't update if duplicate
      }
    }

    const updatedPupils = pupils.map(pupil => {
      if (pupil.id === pupilId) {
        return { ...pupil, [field]: value };
      }
      return pupil;
    });

    // Auto-increment registration number for the next empty student in this class
    if (field === 'registrationNumber' && value) {
      const currentPupilIndex = updatedPupils.findIndex(p => p.id === pupilId);
      
      // Find the next pupil with empty registration number
      const nextEmptyIndex = updatedPupils.findIndex((p, idx) => 
        idx > currentPupilIndex && !p.registrationNumber
      );
      
      if (nextEmptyIndex !== -1) {
        // Use the global next available number
        const nextRegNumber = getNextRegistrationNumber();
        updatedPupils[nextEmptyIndex] = {
          ...updatedPupils[nextEmptyIndex],
          registrationNumber: nextRegNumber
        };
      }
    }

    setPupils(updatedPupils);
  };

  const handleSaveSubjects = () => {
    setSaveMessage('✓ Subjects saved successfully!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  // Handle selecting a student for behavior and attendance editing
  const handleSelectBehaviorStudent = (pupilId: string) => {
    const student = pupils.find(p => p.id === pupilId);
    if (student) {
      setCurrentStudentObservations(student.observations || {});
      setCurrentDaysSchoolOpened(student.daysSchoolOpened || 0);
      setCurrentDaysInAttendance(student.daysInAttendance || 0);
      setCurrentNextTermBegins(student.nextTermBegins || '');
      setCurrentClassTeacherComment(student.classTeacherComment || '');
      setCurrentHeadTeacherComment(student.headTeacherComment || '');
      setCurrentClassTeacherName(student.classTeacherName || '');
      setCurrentHeadTeacherName(student.headTeacherName || '');
      setBehaviorStudentId(pupilId);
    }
  };

  // Handle updating observations for the behavior student
  const handleBehaviorObservationChange = (attribute: string, value: number) => {
    setCurrentStudentObservations(prev => ({
      ...prev,
      [attribute]: value
    }));
  };

  // Handle saving behavior and attendance for the current student
  const handleSaveBehaviorStudent = () => {
    if (!behaviorStudentId) return;

    const updatedPupils = pupils.map(pupil => {
      if (pupil.id === behaviorStudentId) {
        return {
          ...pupil,
          observations: currentStudentObservations,
          daysSchoolOpened: currentDaysSchoolOpened,
          daysInAttendance: currentDaysInAttendance,
          nextTermBegins: currentNextTermBegins,
          classTeacherComment: currentClassTeacherComment,
          headTeacherComment: currentHeadTeacherComment,
          classTeacherName: currentClassTeacherName,
          headTeacherName: currentHeadTeacherName
        };
      }
      return pupil;
    });

    setPupils(updatedPupils);
    
    // Show save message
    const studentName = pupils.find(p => p.id === behaviorStudentId)?.name || 'Student';
    setToastMessage(`✓ ${studentName}'s behavior and attendance saved!`);
    setTimeout(() => setToastMessage(''), 3000);

    // Clear the behavior editor
    setBehaviorStudentId(null);
    setCurrentStudentObservations({});
    setCurrentDaysSchoolOpened(0);
    setCurrentDaysInAttendance(0);
    setCurrentNextTermBegins('');
    setCurrentClassTeacherComment('');
    setCurrentHeadTeacherComment('');
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
          classTeacherComment: pupil.classTeacherComment,
          headTeacherComment: pupil.headTeacherComment
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
          daysSchoolOpened: pupil.daysSchoolOpened || 0,
          daysInAttendance: pupil.daysInAttendance || 0,
          nextTermBegins: pupil.nextTermBegins || '',
          classTeacher: pupil.classTeacherName || schoolInfo.classTeacher || '',
          headOfSchool: pupil.headTeacherName || schoolInfo.headOfSchool || ''
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
        classTeacherComment: studentToExport.classTeacherComment,
        headTeacherComment: studentToExport.headTeacherComment,
        classTeacherName: studentToExport.classTeacherName,
        headTeacherName: studentToExport.headTeacherName
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
        daysSchoolOpened: studentToExport.daysSchoolOpened || 0,
        daysInAttendance: studentToExport.daysInAttendance || 0,
        nextTermBegins: studentToExport.nextTermBegins || '',
        classTeacher: studentToExport.classTeacherName || schoolInfo.classTeacher || '',
        headOfSchool: studentToExport.headTeacherName || schoolInfo.headOfSchool || ''
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
          <div className="admin-notice">
            <span>🔒 Admin Only Feature</span>
          </div>
          <h3>Manage Subjects for {className}:</h3>
          <p className="subject-management-description">
            Configure and manage subjects for this class. Changes made here will only affect this class's current results.
            <br/>To apply subjects to multiple classes, use the <strong>Subject Management</strong> panel in Admin Control.
          </p>
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

          {/* Student Selector and Per-Student Behavior Editor */}
          <div className="behavior-editor-section">
            <div className="student-selector-container">
              <h3>Edit Student Behavior & Attendance</h3>
              <select 
                value={behaviorStudentId || ''}
                onChange={(e) => handleSelectBehaviorStudent(e.target.value)}
                className="student-selector"
              >
                <option value="">-- Select a student to edit --</option>
                {pupils.map(pupil => (
                  <option key={pupil.id} value={pupil.id}>
                    {pupil.name || '(No name)'}
                  </option>
                ))}
              </select>
            </div>

            {behaviorStudentId ? (
              <div className="student-behavior-form">
                <div className="selected-student-info">
                  <h4>Editing: {pupils.find(p => p.id === behaviorStudentId)?.name}</h4>
                </div>

                {/* Observations for current student */}
                <div className="observations-section">
                  <h4>Affective & Psychomotor Observations (Behavioral & Physical Abilities)</h4>
                  <div className="observations-form">
                    <div className="attribute-category">
                      <h5>Classroom Attributes</h5>
                      {['Punctuality', 'Attendance', 'Participation', 'Attitude to work', 'Attentiveness', 'Assignments', 'Handwriting'].map(attr => (
                        <div key={attr} className="attribute-row">
                          <label>{attr}:</label>
                          <select 
                            value={currentStudentObservations[attr] || 0}
                            onChange={(e) => handleBehaviorObservationChange(attr, Number(e.target.value))}
                            className="rating-select"
                          >
                            <option value={0}>-</option>
                            <option value={5}>5 - Excellent</option>
                            <option value={4}>4 - Very good</option>
                            <option value={3}>3 - Good</option>
                            <option value={2}>2 - Weak</option>
                            <option value={1}>1 - Can do better</option>
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="attribute-category">
                      <h5>Psychological Attributes</h5>
                      {['Emotional stability', 'Initiative/Creativity', 'Self-Control', 'Sense of Responsibility', 'Relationship with Students', 'Relationship with Staff', 'Leadership Trait'].map(attr => (
                        <div key={attr} className="attribute-row">
                          <label>{attr}:</label>
                          <select 
                            value={currentStudentObservations[attr] || 0}
                            onChange={(e) => handleBehaviorObservationChange(attr, Number(e.target.value))}
                            className="rating-select"
                          >
                            <option value={0}>-</option>
                            <option value={5}>5 - Excellent</option>
                            <option value={4}>4 - Very good</option>
                            <option value={3}>3 - Good</option>
                            <option value={2}>2 - Weak</option>
                            <option value={1}>1 - Can do better</option>
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="attribute-category">
                      <h5>Social Attributes</h5>
                      {['Neatness', 'Politeness', 'Honesty', 'Verbal Fluency'].map(attr => (
                        <div key={attr} className="attribute-row">
                          <label>{attr}:</label>
                          <select 
                            value={currentStudentObservations[attr] || 0}
                            onChange={(e) => handleBehaviorObservationChange(attr, Number(e.target.value))}
                            className="rating-select"
                          >
                            <option value={0}>-</option>
                            <option value={5}>5 - Excellent</option>
                            <option value={4}>4 - Very good</option>
                            <option value={3}>3 - Good</option>
                            <option value={2}>2 - Weak</option>
                            <option value={1}>1 - Can do better</option>
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="attribute-category">
                      <h5>Physical Attributes</h5>
                      {['Physical Health', 'Games & Sports', 'Dexterity'].map(attr => (
                        <div key={attr} className="attribute-row">
                          <label>{attr}:</label>
                          <select 
                            value={currentStudentObservations[attr] || 0}
                            onChange={(e) => handleBehaviorObservationChange(attr, Number(e.target.value))}
                            className="rating-select"
                          >
                            <option value={0}>-</option>
                            <option value={5}>5 - Excellent</option>
                            <option value={4}>4 - Very good</option>
                            <option value={3}>3 - Good</option>
                            <option value={2}>2 - Weak</option>
                            <option value={1}>1 - Can do better</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Attendance and Signature Section for current student */}
                <div className="attendance-signature-section">
                  <h4>Attendance & Signature Information</h4>
                  <div className="attendance-grid">
                    <div className="attendance-field">
                      <label>Number of days school was opened:</label>
                      <input
                        type="number"
                        value={currentDaysSchoolOpened}
                        onChange={(e) => setCurrentDaysSchoolOpened(Number(e.target.value))}
                        placeholder="e.g., 190"
                        min="0"
                      />
                    </div>
                    <div className="attendance-field">
                      <label>Number of days in attendance:</label>
                      <input
                        type="number"
                        value={currentDaysInAttendance}
                        onChange={(e) => setCurrentDaysInAttendance(Number(e.target.value))}
                        placeholder="e.g., 180"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="attendance-field">
                    <label>Next term begins on:</label>
                    <input
                      type="date"
                      value={currentNextTermBegins}
                      onChange={(e) => setCurrentNextTermBegins(e.target.value)}
                    />
                  </div>
                  <div className="attendance-grid">
                    <div className="attendance-field">
                      <label>Class Teacher Name:</label>
                      <input
                        type="text"
                        value={currentClassTeacherName}
                        onChange={(e) => setCurrentClassTeacherName(e.target.value)}
                        placeholder="Enter class teacher name"
                      />
                    </div>
                    <div className="attendance-field">
                      <label>Head Teacher Name:</label>
                      <input
                        type="text"
                        value={currentHeadTeacherName}
                        onChange={(e) => setCurrentHeadTeacherName(e.target.value)}
                        placeholder="Enter head teacher name"
                      />
                    </div>
                  </div>
                  <div className="signature-grid">
                    <div className="signature-field">
                      <label>Class Teacher Comment:</label>
                      <textarea
                        value={currentClassTeacherComment}
                        onChange={(e) => setCurrentClassTeacherComment(e.target.value)}
                        placeholder="Enter class teacher comment"
                        rows={3}
                      />
                    </div>
                    <div className="signature-field">
                      <label>Head Teacher Comment:</label>
                      <select
                        onChange={(e) => setCurrentHeadTeacherComment(e.target.value)}
                        className="comment-select"
                      >
                        <option value="">-- Select a template --</option>
                        {HEAD_TEACHER_COMMENTS.map((comment, index) => (
                          <option key={index} value={comment}>
                            {comment}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={currentHeadTeacherComment}
                        onChange={(e) => setCurrentHeadTeacherComment(e.target.value)}
                        placeholder="Edit or enter head teacher comment"
                        rows={3}
                        className="comment-textarea"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="behavior-save-section">
                  <button onClick={handleSaveBehaviorStudent} className="save-behavior-btn">
                    💾 Save Student Data
                  </button>
                  <button onClick={() => setBehaviorStudentId(null)} className="cancel-behavior-btn">
                    ✕ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="all-students-observations">
                <p className="info-text">Select a student above to edit their behavior and attendance information</p>
              </div>
            )}
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
