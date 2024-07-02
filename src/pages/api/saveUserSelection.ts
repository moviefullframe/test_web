import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const saveUserSelection = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { user_id, selectedPhotos, selectedOptionsMap } = req.body;

  if (!user_id || !selectedPhotos || !selectedOptionsMap) {
    return res.status(400).json({ message: 'User ID, selected photos, and options are required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const deletePreviousSelectionQuery = 'DELETE FROM user_selections WHERE user_id = ?';
    await connection.execute(deletePreviousSelectionQuery, [user_id]);

    const insertSelectionQuery = `
      INSERT INTO user_selections (user_id, photo_id, options) VALUES (?, ?, ?)
    `;

    for (const photo of selectedPhotos) {
      const options = selectedOptionsMap[photo.id];
      await connection.execute(insertSelectionQuery, [user_id, photo.id, JSON.stringify(options)]);
    }

    connection.end();
    return res.status(200).json({ message: 'Selection saved successfully' });
  } catch (error: any) {
    console.error('[POST] Database query error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export default saveUserSelection;
