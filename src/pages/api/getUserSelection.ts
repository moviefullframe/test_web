import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const getUserSelection = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const [rows] = await connection.execute(
      'SELECT * FROM user_selections WHERE user_id = ?',
      [user_id]
    );

    connection.end();

    if (Array.isArray(rows) && rows.length > 0) {
      return res.status(200).json(rows);
    } else {
      return res.status(404).json({ message: 'Selections not found' });
    }
  } catch (error: any) {
    console.error('[GET] Database query error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export default getUserSelection;
