/**
 * Teacher and Admin Credentials
 * Each teacher has access to only their assigned class
 * Master Admin has access to all classes
 */

export interface UserCredential {
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'admin';
  classId?: number; // undefined for admin (has access to all)
}

// Default teachers - can be overridden by localStorage
const defaultTeachers: UserCredential[] = [
  {
    email: 'teacher1@school.com',
    password: 'Teacher@123',
    name: 'Teacher 1',
    role: 'teacher',
    classId: 1
  },
  {
    email: 'teacher2@school.com',
    password: 'Teacher@123',
    name: 'Teacher 2',
    role: 'teacher',
    classId: 2
  },
  {
    email: 'teacher3@school.com',
    password: 'Teacher@123',
    name: 'Teacher 3',
    role: 'teacher',
    classId: 3
  },
  {
    email: 'teacher4@school.com',
    password: 'Teacher@123',
    name: 'Teacher 4',
    role: 'teacher',
    classId: 4
  },
  {
    email: 'teacher5@school.com',
    password: 'Teacher@123',
    name: 'Teacher 5',
    role: 'teacher',
    classId: 5
  },
  {
    email: 'teacher6@school.com',
    password: 'Teacher@123',
    name: 'Teacher 6',
    role: 'teacher',
    classId: 6
  }
];

// Master admin - always available
const adminCredential: UserCredential = {
  email: 'admin@school.com',
  password: 'Admin@2026',
  name: 'School Administrator',
  role: 'admin'
};

/**
 * Get all credentials (teachers from localStorage or defaults + admin)
 */
export const getAllCredentials = (): UserCredential[] => {
  const savedTeachers = localStorage.getItem('teacherAccounts');
  const teachers = savedTeachers ? JSON.parse(savedTeachers) : defaultTeachers;
  
  // Ensure all teachers have the role field set to 'teacher'
  const normalizedTeachers = teachers.map((teacher: any) => ({
    ...teacher,
    role: teacher.role || 'teacher'
  }));
  
  // Check if admin has updated credentials in localStorage
  const savedAdmin = localStorage.getItem('adminCredential');
  const admin = savedAdmin ? JSON.parse(savedAdmin) : adminCredential;
  
  return [...normalizedTeachers, admin];
};

/**
 * Authenticate user with email and password
 * @returns User credential object if valid, null if invalid
 */
export const authenticateUser = (email: string, password: string): UserCredential | null => {
  const credentials = getAllCredentials();
  const user = credentials.find(cred => cred.email === email && cred.password === password);
  return user || null;
};

/**
 * Reset admin password (Admin-only feature)
 * @throws Error if email is not admin email
 */
export const resetAdminPassword = (newPassword: string): void => {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  // Get current admin credentials
  const savedAdmin = localStorage.getItem('adminCredential');
  const admin = savedAdmin ? JSON.parse(savedAdmin) : { ...adminCredential };

  // Update password
  admin.password = newPassword;

  // Save back to localStorage
  localStorage.setItem('adminCredential', JSON.stringify(admin));
};
