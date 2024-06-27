import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  const { className } = req.query;

  if (!className) {
    return res.status(400).json({ message: 'Class name is required' });
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
      `SELECT families.family_name, family_photos.photo_id, file_names.file_name, family_photos.photo_size, family_photos.photo_chronicle, family_photos.album, family_photos.vignette
       FROM families
       JOIN family_photos ON families.id = family_photos.family_id
       JOIN file_names ON family_photos.photo_id = file_names.id
       WHERE families.class_id = (SELECT id FROM classes WHERE class_name = ?)`,
      [className]
    );

    await connection.end();

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching order summary:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;
