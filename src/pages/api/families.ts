import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    console.log('Only GET requests allowed');
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  const { classId } = req.query;

  try {
    console.log(`Connecting to database with classId: ${classId}`);
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const [rows] = await connection.execute(
      'SELECT id, family_name FROM families WHERE class_id = (SELECT id FROM classes WHERE class_name = ?)',
      [classId]
    );

    connection.end();
    console.log(`Families fetched from database: ${JSON.stringify(rows)}`);

    if (Array.isArray(rows) && rows.length > 0) {
      return res.status(200).json(rows);
    } else {
      console.log('Families not found');
      return res.status(404).json({ message: 'Families not found' });
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;
