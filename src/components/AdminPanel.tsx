import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

interface Teacher {
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'admin';
  classId: number;
}

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'subjects'>('teachers');
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'teacher' as const,
    classId: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Subject Management State
  const [subjects, setSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('global-subjects');
    return saved ? JSON.parse(saved) : ['English', 'Mathematics', 'Science', 'History', 'Geography', 'Civic Studies', 'Physical Education'];
  });
  const [newSubject, setNewSubject] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');

  // Initialize with default teachers
  const getInitialTeachers = (): Teacher[] => {
    const savedTeachers = localStorage.getItem('teacherAccounts');
    if (savedTeachers) {
      return JSON.parse(savedTeachers);
    }
    return [
      { email: 'teacher1@school.com', password: 'Teacher@123', name: 'Teacher 1', role: 'teacher', classId: 1 },
      { email: 'teacher2@school.com', password: 'Teacher@123', name: 'Teacher 2', role: 'teacher', classId: 2 },
      { email: 'teacher3@school.com', password: 'Teacher@123', name: 'Teacher 3', role: 'teacher', classId: 3 },
      { email: 'teacher4@school.com', password: 'Teacher@123', name: 'Teacher 4', role: 'teacher', classId: 4 },
      { email: 'teacher5@school.com', password: 'Teacher@123', name: 'Teacher 5', role: 'teacher', classId: 5 },
      { email: 'teacher6@school.com', password: 'Teacher@123', name: 'Teacher 6', role: 'teacher', classId: 6 }
    ];
  };

  const [teachers, setTeachers] = useState<Teacher[]>(getInitialTeachers());

  // Save teachers to localStorage whenever they change
  useEffect(() => {
    if (teachers.length > 0) {
      localStorage.setItem('teacherAccounts', JSON.stringify(teachers));
    }
  }, [teachers]);

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError('All fields are required');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Invalid email format');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    // Check for duplicate email (unless editing the same teacher)
    const isDuplicate = teachers.some((t, idx) => 
      t.email === formData.email && idx !== editingIndex
    );
    if (isDuplicate) {
      setError('Email already exists');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    if (editingIndex !== null) {
      // Update existing teacher
      const updatedTeachers = [...teachers];
      updatedTeachers[editingIndex] = formData;
      setTeachers(updatedTeachers);
      setSuccess('Teacher updated successfully!');
      setEditingIndex(null);
    } else {
      // Add new teacher
      setTeachers([...teachers, formData]);
      setSuccess('Teacher created successfully!');
    }

    setFormData({ email: '', password: '', name: '', role: 'teacher', classId: 1 });
    setShowForm(false);

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEdit = (index: number) => {
    const teacher = teachers[index];
    setFormData({
      email: teacher.email,
      password: teacher.password,
      name: teacher.name,
      role: 'teacher',
      classId: teacher.classId
    });
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Are you sure you want to delete this teacher account?')) {
      setTeachers(teachers.filter((_, idx) => idx !== index));
      setSuccess('Teacher deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleCancel = () => {
    setFormData({ email: '', password: '', name: '', role: 'teacher', classId: 1 });
    setShowForm(false);
    setEditingIndex(null);
    setError('');
  };

  // Subject Management Handlers
  const handleAddSubject = () => {
    if (!newSubject.trim()) {
      setError('Subject name cannot be empty');
      return;
    }

    if (subjects.includes(newSubject)) {
      setError('Subject already exists');
      return;
    }

    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    localStorage.setItem('global-subjects', JSON.stringify(updatedSubjects));
    setNewSubject('');
    setError('');
    setSuccess('Subject added successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleEditSubject = (index: number) => {
    setEditingSubjectIndex(index);
    setEditingSubjectName(subjects[index]);
  };

  const handleSaveEditSubject = (index: number) => {
    if (!editingSubjectName.trim()) {
      setError('Subject name cannot be empty');
      return;
    }

    if (subjects.includes(editingSubjectName) && subjects[index] !== editingSubjectName) {
      setError('Subject name already exists');
      return;
    }

    const updatedSubjects = [...subjects];
    updatedSubjects[index] = editingSubjectName;
    setSubjects(updatedSubjects);
    localStorage.setItem('global-subjects', JSON.stringify(updatedSubjects));
    setEditingSubjectIndex(null);
    setEditingSubjectName('');
    setError('');
    setSuccess('Subject updated successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleDeleteSubject = (index: number) => {
    if (subjects.length <= 1) {
      setError('You must have at least one subject');
      return;
    }

    if (window.confirm('Are you sure you want to delete this subject?')) {
      const updatedSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(updatedSubjects);
      localStorage.setItem('global-subjects', JSON.stringify(updatedSubjects));
      setSuccess('Subject deleted successfully!');
      setError('');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const toggleClassSelection = (classId: number) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleApplySubjectsToClasses = () => {
    if (selectedClasses.length === 0) {
      setError('Please select at least one class');
      return;
    }

    try {
      selectedClasses.forEach(classId => {
        localStorage.setItem(`class-${classId}-subjects`, JSON.stringify(subjects));
      });

      setSuccess(`Subjects applied to ${selectedClasses.length} class(es) successfully!`);
      setSelectedClasses([]);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to apply subjects');
    }
  };

  const handleApplySubjectsToAllClasses = () => {
    if (window.confirm('Are you sure you want to apply these subjects to ALL classes? This will overwrite existing subjects.')) {
      try {
        for (let classId = 1; classId <= 6; classId++) {
          localStorage.setItem(`class-${classId}-subjects`, JSON.stringify(subjects));
        }
        setSuccess('Subjects applied to all 6 classes successfully!');
        setSelectedClasses([]);
        setError('');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to apply subjects to all classes');
      }
    }
  };

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>👨‍💼 Admin Control Panel</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            👥 Teacher Management
          </button>
          <button
            className={`admin-tab ${activeTab === 'subjects' ? 'active' : ''}`}
            onClick={() => setActiveTab('subjects')}
          >
            📚 Subject Management
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {activeTab === 'teachers' && (
          <>
            {!showForm ? (
              <div className="teachers-list-section">
                <div className="section-title-bar">
                  <h3>Active Teachers</h3>
                  <button className="add-btn" onClick={() => setShowForm(true)}>
                    ➕ Add New Teacher
                  </button>
                </div>

                <div className="teachers-table">
                  <div className="table-header">
                    <div className="col-name">Name</div>
                    <div className="col-email">Email</div>
                    <div className="col-class">Class</div>
                    <div className="col-actions">Actions</div>
                  </div>

                  <div className="table-body">
                    {teachers.map((teacher, index) => (
                      <div key={index} className="table-row">
                        <div className="col-name">{teacher.name}</div>
                        <div className="col-email">{teacher.email}</div>
                        <div className="col-class">Class {teacher.classId}</div>
                        <div className="col-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEdit(index)}
                            title="Edit teacher"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDelete(index)}
                            title="Delete teacher"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-footer">
                  <p>Total Teachers: {teachers.length}</p>
                </div>
              </div>
            ) : (
              <form className="teacher-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Teacher Name *</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Teacher 1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., teacher1@school.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="classId">Assign to Class *</label>
                  <select
                    id="classId"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: parseInt(e.target.value) })}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6].map(classNum => (
                      <option key={classNum} value={classNum}>
                        Class {classNum}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {editingIndex !== null ? 'Update Teacher' : 'Create Teacher'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {activeTab === 'subjects' && (
          <div className="subject-management-section">
            <h3>Global Subject Configuration</h3>
            
            <div className="subject-input-group">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Enter new subject name"
                className="subject-input-field"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
              />
              <button onClick={handleAddSubject} className="add-subject-btn">
                ➕ Add Subject
              </button>
            </div>

            <div className="current-subjects">
              <h4>Current Subjects ({subjects.length})</h4>
              <div className="subjects-list">
                {subjects.map((subject, index) => (
                  <div key={index} className="subject-item-admin">
                    {editingSubjectIndex === index ? (
                      <>
                        <input
                          type="text"
                          value={editingSubjectName}
                          onChange={(e) => setEditingSubjectName(e.target.value)}
                          className="subject-edit-input"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditSubject(index)}
                          className="save-edit-btn"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingSubjectIndex(null);
                            setEditingSubjectName('');
                          }}
                          className="cancel-edit-btn"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="subject-name">{subject}</span>
                        <button
                          onClick={() => handleEditSubject(index)}
                          className="edit-subject-btn"
                          title="Edit subject"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(index)}
                          className="delete-subject-btn-admin"
                          title="Delete subject"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="class-selection">
              <h4>Apply Subjects to Classes</h4>
              <div className="class-checkboxes">
                {[1, 2, 3, 4, 5, 6].map(classId => (
                  <label key={classId} className="class-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(classId)}
                      onChange={() => toggleClassSelection(classId)}
                    />
                    Class {classId}
                  </label>
                ))}
              </div>
            </div>

            <div className="apply-actions">
              <button
                onClick={handleApplySubjectsToClasses}
                className="apply-btn"
                disabled={selectedClasses.length === 0}
              >
                ✓ Apply to Selected Classes ({selectedClasses.length})
              </button>
              <button
                onClick={handleApplySubjectsToAllClasses}
                className="apply-all-btn"
              >
                ✓ Apply to All 6 Classes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
