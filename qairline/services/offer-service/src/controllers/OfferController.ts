// Controller xu ly nghiep vu quan ly offers (khuyen mai/tin tuc)
import { Request, Response } from 'express';
import connection from '../database/database';
import { CreateOfferRequest, DeleteOfferRequest } from '../types/offer';
import { sendEmail } from '../services/EmailService';

export class OfferController {
  // Lay tat ca offers (public - khong can dang nhap)
  getAllOffers(req: Request, res: Response): void {
    const query = 'SELECT PostID, Title, Content, PostDate FROM Offers';
    
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
        return;
      }

      if ((results as any).length === 0) {
        res.status(404).json({ message: 'No offers found' });
        return;
      }

      res.status(200).json(results);
    });
  }

  // Tao offer moi (Admin only) va gui email thong bao cho tat ca users
  createOffer(req: Request, res: Response): void {
    const { title, content, userID }: CreateOfferRequest = req.body;

    if (!title || !content || !userID) {
      res.status(400).json({ message: 'Missing required fields: title, content, or UserID' });
      return;
    }

    // Kiem tra admin (TODO: nen goi user-service API thay vi query truc tiep)
    const checkAdminQuery = 'SELECT Role FROM Users WHERE UserID = ?';
    connection.query(checkAdminQuery, [userID], (err, userResults: any) => {
      if (err) {
        res.status(500).json({ message: 'Error checking user role', error: err.message });
        return;
      }

      if (userResults.length === 0 || userResults[0].Role !== 'Admin') {
        res.status(403).json({ message: 'Permission denied: User does not exist or is not an admin' });
        return;
      }

      // Tao offer moi
      const insertQuery = 'INSERT INTO Offers (Title, Content) VALUES (?, ?)';
      connection.query(insertQuery, [title, content], (err) => {
        if (err) {
          console.error('Error inserting offer:', err);
          res.status(500).json({ message: 'Failed to create Offer' });
          return;
        }

        // Lay email tat ca users de gui thong bao
        const getUsersQuery = 'SELECT Email FROM Users WHERE Email IS NOT NULL';
        connection.query(getUsersQuery, async (err, results) => {
          if (err) {
            console.error('Error fetching user emails:', err);
            res.status(500).json({ message: 'Failed to fetch user emails' });
            return;
          }

          const emails = (results as any[]).map((user) => user.Email);

          try {
            // Gui email song song cho tat ca users
            await Promise.all(
              emails.map((email) =>
                sendEmail(
                  email,
                  `New Offer: ${title}`,
                  `Hello,\n\nWe have a new offer for you:\n\n${content}\n\nBest regards,\nQAirline Team`
                ).catch((error) => {
                  console.error(`Failed to send email to ${email}:`, error);
                })
              )
            );

            const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            res.status(201).json({
              message: 'Offer created successfully and notifications sent',
              timestamp,
            });
          } catch (error) {
            console.error('Error during email notifications:', error);
            res.status(500).json({ message: 'Offer created but failed to send notifications' });
          }
        });
      });
    });
  }

  // Xoa offer (Admin only)
  deleteOffer(req: Request, res: Response): void {
    const { postID, UserID }: DeleteOfferRequest = req.body;

    if (!postID || !UserID) {
      res.status(400).json({ message: 'Missing required fields: postID or UserID' });
      return;
    }

    // Kiem tra admin (TODO: nen goi user-service API)
    const checkAdminQuery = 'SELECT Role FROM Users WHERE UserID = ?';
    connection.query(checkAdminQuery, [UserID], (err, userResults: any) => {
      if (err) {
        res.status(500).json({ message: 'Error checking user role', error: err.message });
        return;
      }

      if (userResults.length === 0 || userResults[0].Role !== 'Admin') {
        res.status(403).json({ message: 'Permission denied: User is not an admin' });
        return;
      }

      // Kiem tra offer co ton tai khong
      const checkPostQuery = 'SELECT PostID FROM Offers WHERE PostID = ?';
      connection.query(checkPostQuery, [postID], (err, postResults: any) => {
        if (err) {
          res.status(500).json({ message: 'Error checking post existence', error: err.message });
          return;
        }

        if (postResults.length === 0) {
          res.status(404).json({ message: 'Post not found' });
          return;
        }

        // Xoa offer
        const deleteQuery = 'DELETE FROM Offers WHERE PostID = ?';
        connection.query(deleteQuery, [postID], (err, results: any) => {
          if (err) {
            console.error('Error executing query:', err.stack);
            res.status(500).json({ message: 'Internal Server Error', error: err.message });
            return;
          }

          if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Offer not found or user does not have permission' });
            return;
          }

          res.status(200).json({ message: 'Offer deleted successfully' });
        });
      });
    });
  }
}