import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
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

    const getUserSelectionQuery = 'SELECT photo_id, options FROM user_selections WHERE user_id = ?';
    const [rows] = await connection.execute<[mysql.RowDataPacket[]]>(getUserSelectionQuery, [user_id]);

    const selectedPhotos = rows.map((row: any) => row.photo_id);
    const selectedOptionsMap = rows.reduce((map: any, row: any) => {
      map[row.photo_id] = JSON.parse(row.options);
      return map;
    }, {});

    connection.end();
    return res.status(200).json({ selectedPhotos, selectedOptionsMap });
  } catch (error: any) {
    console.error('[GET] Database query error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export default handler;
