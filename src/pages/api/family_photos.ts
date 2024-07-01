import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  const { class_id } = req.query;

  if (!class_id) {
    return res.status(400).json({ message: 'Class ID is required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const [photoRows] = await connection.execute(
      `SELECT family_photos.*, file_names.file_name, families.family_name 
       FROM family_photos
       JOIN file_names ON family_photos.photo_id = file_names.id
       JOIN families ON family_photos.family_id = families.id
       WHERE family_photos.class_id = ?`,
      [class_id]
    );

    await connection.end();

    if (Array.isArray(photoRows) && photoRows.length > 0) {
      return res.status(200).json(photoRows);
    } else {
      return res.status(404).json({ message: 'Photos not found' });
    }
  } catch (error) {
    console.error('Error fetching family photos:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;
