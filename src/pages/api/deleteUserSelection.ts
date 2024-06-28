import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Only DELETE requests allowed' });
  }

  const { user_id, photo_id } = req.body;

  if (!user_id || !photo_id) {
    return res.status(400).json({ message: 'User ID and photo ID are required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const deleteSelectionQuery = 'DELETE FROM user_selections WHERE user_id = ? AND photo_id = ?';
    await connection.execute(deleteSelectionQuery, [user_id, photo_id]);

    connection.end();
    return res.status(200).json({ message: 'Selection deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE] Database query error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export default handler;
