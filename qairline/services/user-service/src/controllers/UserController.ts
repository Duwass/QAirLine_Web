// Controller quan ly user: authentication va CRUD users
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connection from '../database/database';

export class UserController {
  // Dang nhap: kiem tra email/password va tra ve JWT token
  signIn(req: Request, res: Response): void {
    const { email, password } = req.body;
    
    connection.execute('SELECT * FROM Users WHERE Email = ?', [email], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ message: 'Error querying database' });
      }

      const rows = results as any[];
      if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const user = rows[0];

      bcrypt.compare(password, user.Password, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).json({ message: 'Error comparing passwords' });
        }

        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
          {
            userid: user.UserID,
            email: user.Email,
            username: user.Username,
            name: user.Name,
            role: user.Role,
          },
          'secret_key',
          { expiresIn: '1h' }
        );

        return res.json({
          message: 'Sign in successful',
          token,
        });
      });
    });
  }

  // Dang ky: tao user moi voi password da hash, tra ve JWT token
  signUp(req: Request, res: Response): void {
    const { name, username, email, password, role } = req.body;

    connection.execute('SELECT * FROM Users WHERE Username = ? OR Email = ?', [username, email], (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ message: 'Error querying database' });
      }

      const rows = results as any[];
      if (rows.length > 0) {
        return res.status(400).json({ message: 'Username or Email already exists' });
      }

      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ message: 'Error hashing password' });
        }

        connection.execute(
          'INSERT INTO Users (Name, Username, Email, Password, Role) VALUES (?, ?, ?, ?, ?)',
          [name, username, email, hashedPassword, role],
          (err, result: any) => {
            if (err) {
              console.error('Database insert error:', err);
              return res.status(500).json({ message: 'Error inserting user into database' });
            }

            const token = jwt.sign(
              { userid: result.insertId, email, username, name, role },
              'secret_key',
              { expiresIn: '1h' }
            );

            res.status(201).json({
              message: 'Sign up successful',
              token,
            });
          }
        );
      });
    });
  }

  // Lay tat ca users (Admin only - validation o frontend/gateway)
  getAllUsers(req: Request, res: Response): void {
    const query = 'SELECT * FROM Users';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
        return;
      }

      if ((results as any).length === 0) {
        res.status(404).json({ message: 'No users found' });
        return;
      }

      res.status(200).json(results);
    });
  }

  // Xoa user theo UserID (Admin only - validation o frontend/gateway)
  deleteUser(req: Request, res: Response): void {
    const { UserID } = req.body;

    if (!UserID) {
      res.status(400).json({ message: 'Missing required field: userID' });
      return;
    }

    const query = 'DELETE FROM Users WHERE UserID = ?';
    connection.query(query, [UserID], (err, result: any) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
        return;
      }

      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({ message: 'User deleted successfully' });
    });
  }
}