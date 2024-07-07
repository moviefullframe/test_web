import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import { Family, Class } from '../../types';  // Исправленный путь

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    console.log('Only GET requests allowed');
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  const { class_id } = req.query;

  if (!class_id) {
    return res.status(400).json({ message: 'Class ID is required' });
  }

  try {
    console.log(`Connecting to database with class_id: ${class_id}`);
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    // Получаем данные класса и школы
    const [classRows] = await connection.execute<any[]>(
      'SELECT id, school_name FROM classes WHERE id = ?',
      [class_id]
    );

    if (!Array.isArray(classRows) || classRows.length === 0) {
      console.log('Class not found');
      return res.status(404).json({ message: 'Class not found' });
    }

    const classData: Class = classRows[0];

    // Получаем данные семей
    const [familyRows] = await connection.execute<any[]>(
      'SELECT id, family_name FROM families WHERE class_id = ?',
      [classData.id]
    );

    connection.end();
    console.log(`Families fetched from database: ${JSON.stringify(familyRows)}`);

    if (Array.isArray(familyRows) && familyRows.length > 0) {
      const families: Family[] = familyRows.map(row => ({
        id: row.id,
        class_id: row.class_id,
        family_name: row.family_name,
        photo_chronicle: row.photo_chronicle,
        vignette: row.vignette,
        photo_10x15: row.photo_10x15,
        photo_20x30: row.photo_20x30,
        file_name_id: row.file_name_id
      }));

      return res.status(200).json({
        class_id: classData.id,
        schoolName: classData.school_name,
        families: families,
      });
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
