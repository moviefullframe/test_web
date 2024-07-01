import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket } from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Only DELETE requests allowed' });
  }

  const { class_name, family_name, photo_id } = req.body; // Добавляем photo_id для удаления конкретной фотографии

  if (!class_name || !family_name || !photo_id) {
    console.log('Missing parameters:', { class_name, family_name, photo_id });
    return res.status(400).json({ message: 'Class name, family name, and photo ID are required' });
  }

  console.log('[DELETE] Received request:', req.body);

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    console.log('[DELETE] Connected to database');

    // Получаем class_id по class_name
    const classIdQuery = 'SELECT id FROM classes WHERE class_name = ?';
    console.log('Executing query:', classIdQuery, [class_name]);
    const [classIdResult] = await connection.execute<RowDataPacket[]>(classIdQuery, [class_name]);

    if (classIdResult.length === 0) {
      console.log('Class not found for class_name:', class_name);
      connection.end();
      return res.status(404).json({ message: 'Class not found' });
    }

    const classId = classIdResult[0].id;
    console.log('Class ID:', classId);

    const familyIdQuery = `
      SELECT id FROM families WHERE family_name = ? AND class_id = ?
    `;
    const [familyIdResult] = await connection.execute<RowDataPacket[]>(familyIdQuery, [family_name, classId]);

    console.log('[DELETE] familyIdQuery result:', familyIdResult);

    if (familyIdResult.length === 0) {
      connection.end();
      return res.status(404).json({ message: 'Family not found' });
    }

    const familyId = familyIdResult[0].id;
    console.log('Family ID:', familyId);

    const photoIdsQuery = 'SELECT photo_id FROM family_photos WHERE family_id = ? AND photo_id = ?';
    const [photoIdsResult] = await connection.execute<RowDataPacket[]>(photoIdsQuery, [familyId, photo_id]);

    console.log('[DELETE] photoIdsQuery result:', photoIdsResult);

    if (photoIdsResult.length === 0) {
      console.log('Photo not found for the specified family:', { familyId, photo_id });
      connection.end();
      return res.status(404).json({ message: 'Photo not found for the specified family' });
    }

    const photoId = photoIdsResult[0].photo_id;
    console.log('[DELETE] Photo ID to be deleted:', photoId);

    const deleteFamilyPhotosQuery = 'DELETE FROM family_photos WHERE family_id = ? AND photo_id = ?';
    console.log('Executing query:', deleteFamilyPhotosQuery, [familyId, photoId]);
    const [deleteFamilyPhotosResult] = await connection.execute(deleteFamilyPhotosQuery, [familyId, photoId]);
    console.log('[DELETE] Deleted from family_photos:', deleteFamilyPhotosResult);

    const deleteFileNamesQuery = 'DELETE FROM file_names WHERE id = ?';
    console.log('Executing query:', deleteFileNamesQuery, [photoId]);
    const [deleteFileNamesResult] = await connection.execute(deleteFileNamesQuery, [photoId]);
    console.log('[DELETE] Deleted from file_names:', deleteFileNamesResult);

    connection.end();
    console.log('[DELETE] Connection closed');

    return res.status(200).json({ message: 'Selection deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE] Database query error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export default handler;
