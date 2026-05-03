import React, { createContext, useContext, useState, useEffect } from 'react';

export interface School {
  id: string;
  name: string;
  email: string;
  logo_url?: string;
  subscription_plan: 'basic' | 'pro' | 'enterprise';
}

export interface TenantContextType {
  currentSchool: School | null;
  schools: School[];
  switchSchool: (schoolId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [schools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load school on mount
  useEffect(() => {
    const loadSchool = async () => {
      try {
        const schoolId = localStorage.getItem('school_id');
        if (schoolId) {
          // Fetch school details from API
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/schools/${schoolId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          });
          
          if (response.ok) {
            const school = await response.json();
            setCurrentSchool(school);
          }
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load school');
        setLoading(false);
      }
    };

    loadSchool();
  }, []);

  const switchSchool = async (schoolId: string) => {
    try {
      setLoading(true);
      // Update school in localStorage
      localStorage.setItem('school_id', schoolId);
      
      // Fetch school details
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/schools/${schoolId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const school = await response.json();
        setCurrentSchool(school);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch school');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TenantContext.Provider value={{ currentSchool, schools, switchSchool, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
