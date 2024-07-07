import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const class_id = parseInt(req.query.class_id as string, 10);

  if (isNaN(class_id)) {
    return res.status(400).json({ message: 'Missing or invalid class_id parameter' });
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
      `SELECT account_types.type_name 
       FROM account_types 
       JOIN classes ON account_types.id = classes.account_type_id 
       WHERE classes.id = ?`,
      [class_id]
    );

    await connection.end();

    if (Array.isArray(rows) && rows.length > 0) {
      console.log('Account type found:', rows[0]); // Лог для отладки
      return res.status(200).json({ accountType: rows[0] });
    } else {
      console.log('No account type found for class_id:', class_id); // Лог для отладки
      return res.status(404).json({ message: 'Account type not found' });
    }
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
