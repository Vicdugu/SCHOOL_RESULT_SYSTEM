import express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import {
  validateEmail,
  validatePassword,
  validateSchoolName,
} from '../utils/validators';
import { handleError, ValidationError, UnauthorizedError } from '../utils/errors';
import { queryOne, queryAll, queryExecute, generateId } from '../utils/db';

export const createAuthRoutes = (pool: Pool): Router => {
  const router = express.Router();

  /**
   * POST /api/v1/auth/register
   * Register a new school and admin user
   */
  router.post('/register', async (req, res) => {
    try {
      const { school_name, email, password } = req.body;

      // Validate inputs
      validateSchoolName(school_name);
      validateEmail(email);
      validatePassword(password);

      // Check if school already exists
      const existingSchool = await queryOne(
        pool,
        'SELECT id FROM schools WHERE LOWER(email) = LOWER($1)',
        [email]
      );

      if (existingSchool) {
        throw new ValidationError('School with this email already exists');
      }

      const schoolId = generateId();
      const userId = generateId();
      const passwordHash = await bcrypt.hash(password, 10);

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create school
        await client.query(
          `INSERT INTO schools (id, name, email, subscription_plan, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [schoolId, school_name, email, 'basic']
        );

        // Create admin user
        await client.query(
          `INSERT INTO users (id, school_id, email, role, password_hash, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [userId, schoolId, email, 'admin', passwordHash]
        );

        await client.query('COMMIT');

        // Generate JWT token
        const token = jwt.sign(
          {
            id: userId,
            school_id: schoolId,
            email,
            role: 'admin',
          },
          process.env.JWT_SECRET!,
          { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
          message: 'School registered successfully',
          token,
          user: {
            id: userId,
            school_id: schoolId,
            email,
            role: 'admin',
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  router.post('/login', async (req, res) => {
    try {
      const { email, password, school_id } = req.body;

      if (!email || !password || !school_id) {
        throw new ValidationError('Email, password, and school_id are required');
      }

      // Find user in school
      const user = await queryOne(
        pool,
        `SELECT id, school_id, email, role, password_hash 
         FROM users 
         WHERE school_id = $1 AND LOWER(email) = LOWER($2)`,
        [school_id, email]
      );

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate token
      const token = jwt.sign(
        {
          id: user.id,
          school_id: user.school_id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Store session in Redis if available
      if (req.app.locals.redis) {
        const sessionKey = `session:${token}`;
        await req.app.locals.redis.set(
          sessionKey,
          JSON.stringify({
            userId: user.id,
            schoolId: user.school_id,
            email: user.email,
            role: user.role,
          }),
          { EX: 7 * 24 * 60 * 60 } // 7 days
        );
      }

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          school_id: user.school_id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * POST /api/v1/auth/refresh
   * Refresh JWT token
   */
  router.post('/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET!
      ) as any;

      // Verify user still exists
      const user = await queryOne(
        pool,
        `SELECT id, school_id, email, role FROM users WHERE id = $1 AND school_id = $2`,
        [decoded.id, decoded.school_id]
      );

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Generate new token
      const newToken = jwt.sign(
        {
          id: user.id,
          school_id: user.school_id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        token: newToken,
        user,
      });
    } catch (error) {
      handleError(error, res);
    }
  });

  /**
   * POST /api/v1/auth/logout
   * Logout user (invalidate session)
   */
  router.post('/logout', async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (token && req.app.locals.redis) {
        const sessionKey = `session:${token}`;
        await req.app.locals.redis.del(sessionKey);
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
};
