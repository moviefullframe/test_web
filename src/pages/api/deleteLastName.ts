import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket, FieldPacket } from 'mysql2/promise'; 
import { ResultSetHeader } from 'mysql2';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { photo_id, lastName, class_id } = req.body;

  if (!photo_id || !lastName || !class_id) {
    return res.status(400).json({ message: 'Photo ID, last name, and class ID are required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    // Удаляем фамилию из таблицы photo_mappings
    const [result]: [ResultSetHeader, FieldPacket[]] = await connection.execute(
      `UPDATE photo_mappings SET family_name = NULL WHERE id = ?`,
      [photo_id]
    );

    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Проверяем, есть ли ещё фотографии, связанные с этой фамилией
    const [photos]: [RowDataPacket[], FieldPacket[]] = await connection.execute(
      `SELECT id FROM photo_mappings WHERE family_name = ? AND class_id = ?`,
      [lastName, class_id]
    );

    if (photos.length === 0) {
      // Если нет фотографий, связанных с этой фамилией, удаляем запись из таблицы families
      const [deleteResult]: [ResultSetHeader, FieldPacket[]] = await connection.execute(
        `DELETE FROM families WHERE family_name = ? AND class_id = ?`,
        [lastName, class_id]
      );
      
      if (deleteResult.affectedRows > 0) {
        console.log('Family record removed from families table:', { lastName, class_id });
      } else {
        console.log('No matching family record found in families table to delete.');
      }
    } else {
      console.log('Family record remains in families table due to existing photos.');
    }

    await connection.end();

    return res.status(200).json({ message: 'Last name removed successfully' });
  } catch (error) {
    console.error('Error removing last name:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;
