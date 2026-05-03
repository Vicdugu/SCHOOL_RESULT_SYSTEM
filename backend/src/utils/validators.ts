import { ValidationError } from './errors';

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validatePassword = (password: string): void => {
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters');
  }
};

export const validateSchoolName = (name: string): void => {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('School name is required');
  }
  if (name.length > 255) {
    throw new ValidationError('School name must be 255 characters or less');
  }
};

export const validateClassName = (name: string): void => {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Class name is required');
  }
  if (name.length > 100) {
    throw new ValidationError('Class name must be 100 characters or less');
  }
};

export const validatePupilName = (name: string): void => {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Pupil name is required');
  }
  if (name.length > 255) {
    throw new ValidationError('Pupil name must be 255 characters or less');
  }
};

export const validateScore = (score: number | null): void => {
  if (score === null || score === undefined) {
    return; // Optional field
  }
  if (typeof score !== 'number' || score < 0 || score > 100) {
    throw new ValidationError('Score must be between 0 and 100');
  }
};

export const validateObservationRating = (rating: number | null): void => {
  if (rating === null || rating === undefined) {
    return; // Optional field
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }
};

export const validateSubjectName = (name: string): void => {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Subject name is required');
  }
  if (name.length > 100) {
    throw new ValidationError('Subject name must be 100 characters or less');
  }
};

export const validateTerm = (term: string): void => {
  const validTerms = ['Term 1', 'Term 2', 'Term 3'];
  if (!validTerms.includes(term)) {
    throw new ValidationError('Invalid term');
  }
};

export const validateRole = (role: string): void => {
  const validRoles = ['admin', 'teacher', 'auditor'];
  if (!validRoles.includes(role)) {
    throw new ValidationError('Invalid role');
  }
};
