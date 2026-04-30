import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ResultTabContent from './ResultTabContent';
import SchoolHeader from './SchoolHeader';
import AdminPanel from './AdminPanel';
import './Dashboard.css';

const DEFAULT_SUBJECTS = ['English', 'Mathematics', 'Science', 'History', 'Geography', 'Civic Studies', 'Physical Education'];

const ALL_CLASSES = [
  { id: 1, name: 'Class 1' },
  { id: 2, name: 'Class 2' },
  { id: 3, name: 'Class 3' },
  { id: 4, name: 'Class 4' },
  { id: 5, name: 'Class 5' },
  { id: 6, name: 'Class 6' }
];

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeClass, setActiveClass] = useState(1);
  const [activeSubject, setActiveSubject] = useState(0);
  const [isClassesCollapsed, setIsClassesCollapsed] = useState(false);
  const [isSubjectsCollapsed, setIsSubjectsCollapsed] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Filter classes based on user role
  const classes = user?.role === 'teacher' && user?.classId
    ? ALL_CLASSES.filter(cls => cls.id === user.classId)
    : ALL_CLASSES;

  // Initialize activeClass based on user role
  useEffect(() => {
    if (user?.role === 'teacher' && user?.classId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveClass(user.classId);
    } else if (classes.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveClass(classes[0].id);
    }
  }, [user?.role, user?.classId, classes]);

  // Load subjects when class changes
  useEffect(() => {
    const storedSubjects = localStorage.getItem(`class-${activeClass}-subjects`);
    if (storedSubjects) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubjects(JSON.parse(storedSubjects));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubjects([...DEFAULT_SUBJECTS]);
    }
    setActiveSubject(0);
  }, [activeClass]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>School Result Management System</h1>
          {user?.role === 'teacher' && user?.classId && (
            <p className="teacher-class-info">
              📚 {user.name} - Class {user.classId} Only
            </p>
          )}
          {user?.role === 'admin' && (
            <p className="admin-info">
              👨‍💼 Master Administrator - All Classes
            </p>
          )}
        </div>
        <div className="header-right">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="admin-panel-btn"
              title="Manage Teachers"
              aria-label="Open admin panel"
            >
              ⚙️ Teachers
            </button>
          )}
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <SchoolHeader />

      <div className="dashboard-content">
        <aside className="sidebar">
          {/* Classes Section */}
          <div className="sidebar-section">
            <button
              className="section-header"
              onClick={() => setIsClassesCollapsed(!isClassesCollapsed)}
              title={isClassesCollapsed ? 'Expand Classes' : 'Collapse Classes'}
            >
              <span className="section-title">Classes</span>
              <span className={`collapse-icon ${isClassesCollapsed ? 'collapsed' : ''}`}>▼</span>
            </button>
            
            {!isClassesCollapsed && (
              <nav className="class-tabs">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    className={`class-tab ${activeClass === cls.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveClass(cls.id);
                      setActiveSubject(0);
                    }}
                  >
                    {cls.name}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Subjects Section */}
          <div className="sidebar-section subjects-section">
            <button
              className="section-header"
              onClick={() => setIsSubjectsCollapsed(!isSubjectsCollapsed)}
              title={isSubjectsCollapsed ? 'Expand Subjects' : 'Collapse Subjects'}
            >
              <span className="section-title">Subjects</span>
              <span className={`collapse-icon ${isSubjectsCollapsed ? 'collapsed' : ''}`}>▼</span>
            </button>

            {!isSubjectsCollapsed && (
              <>
                <div className="active-class-info">
                  {classes.find(c => c.id === activeClass)?.name}
                </div>
                <nav className="subject-tabs">
                  {user?.role === 'admin' && (
                    <button
                      className={`subject-tab ${activeSubject === -1 ? 'active' : ''}`}
                      onClick={() => setActiveSubject(-1)}
                    >
                      ⚙️ Manage Subjects
                    </button>
                  )}
                  {subjects.map((subject, index) => (
                    <button
                      key={index}
                      className={`subject-tab ${activeSubject === index ? 'active' : ''}`}
                      onClick={() => setActiveSubject(index)}
                    >
                      {subject}
                    </button>
                  ))}
                </nav>
              </>
            )}
          </div>
        </aside>

        <main className="main-content">
          <ResultTabContent 
            classId={activeClass} 
            className={classes.find(c => c.id === activeClass)?.name || ''}
            activeSubject={activeSubject}
            setActiveSubject={setActiveSubject}
            subjects={subjects}
            setSubjects={setSubjects}
            userRole={user?.role}
          />
        </main>
      </div>

      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
};

export default Dashboard;
