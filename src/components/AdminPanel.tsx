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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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

  // Load teachers from localStorage on mount
  useEffect(() => {
    const savedTeachers = localStorage.getItem('teacherAccounts');
    if (savedTeachers) {
      setTeachers(JSON.parse(savedTeachers));
    } else {
      // Load default teachers
      const defaultTeachers: Teacher[] = [
        { email: 'teacher1@school.com', password: 'Teacher@123', name: 'Teacher 1', role: 'teacher', classId: 1 },
        { email: 'teacher2@school.com', password: 'Teacher@123', name: 'Teacher 2', role: 'teacher', classId: 2 },
        { email: 'teacher3@school.com', password: 'Teacher@123', name: 'Teacher 3', role: 'teacher', classId: 3 },
        { email: 'teacher4@school.com', password: 'Teacher@123', name: 'Teacher 4', role: 'teacher', classId: 4 },
        { email: 'teacher5@school.com', password: 'Teacher@123', name: 'Teacher 5', role: 'teacher', classId: 5 },
        { email: 'teacher6@school.com', password: 'Teacher@123', name: 'Teacher 6', role: 'teacher', classId: 6 }
      ];
      setTeachers(defaultTeachers);
      localStorage.setItem('teacherAccounts', JSON.stringify(defaultTeachers));
    }
  }, []);

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

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>👨‍💼 Teacher Management</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

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
      </div>
    </div>
  );
};

export default AdminPanel;
