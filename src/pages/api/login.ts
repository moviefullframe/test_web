import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { login, password } = req.body;

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const [rows] = await connection.execute(
      'SELECT c.*, a.type_name FROM classes c LEFT JOIN account_types a ON c.account_type_id = a.id WHERE login = ? AND password = ?',
      [login, password]
    );

    connection.end();

    if (Array.isArray(rows) && rows.length > 0) {
      return res.status(200).json(rows[0]);
    } else {
      return res.status(401).json({ message: 'Invalid login or password' });
    }
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;
