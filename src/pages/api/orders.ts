import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const query = `
      SELECT family_photos.*, photo_mappings.file_name, families.family_name, classes.school_name, classes.class_name 
      FROM family_photos
      JOIN photo_mappings ON family_photos.photo_id = photo_mappings.id
      JOIN families ON family_photos.family_id = families.id
      JOIN classes ON family_photos.class_id = classes.id
      WHERE family_photos.class_id = ?`;

    const [rows] = await connection.execute(query, [class_id]);

    console.log('Fetched rows:', rows); // Логируем полученные данные

    await connection.end();

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching family photos:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
