import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket } from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('Received DELETE request:', req.method);

  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Only DELETE requests allowed' });
  }

  const { class_id, family_name, photo_id } = req.body;
  console.log('Request body:', req.body);

  if (!class_id || !family_name || !photo_id) {
    console.log('Missing parameters:', { class_id, family_name, photo_id });
    return res.status(400).json({ message: 'Class ID, family name, and photo ID are required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });


    console.log('[DELETE] Connected to database');

    // Шаг 1: Получение family_id
    const familyIdQuery = 'SELECT id FROM families WHERE family_name = ? AND class_id = ?';
    console.log('[DELETE] Executing query to get family ID:', familyIdQuery, [family_name, class_id]);
    const [familyIdResult]: [RowDataPacket[], any] = await connection.execute(familyIdQuery, [family_name, class_id]);

    if (familyIdResult.length === 0) {
      console.log('[DELETE] Family not found for family_name:', family_name);
      await connection.end();
      return res.status(404).json({ message: 'Family not found' });
    }

    const familyId = familyIdResult[0].id;
    console.log('[DELETE] Family ID:', familyId);

    // Шаг 2: Проверка существования фото для данного family_id
    const photoIdsQuery = 'SELECT photo_id FROM family_photos WHERE family_id = ? AND photo_id = ?';
    console.log('[DELETE] Executing query to verify photo existence:', photoIdsQuery, [familyId, photo_id]);
    const [photoIdsResult]: [RowDataPacket[], any] = await connection.execute(photoIdsQuery, [familyId, photo_id]);

    console.log('[DELETE] photoIdsQuery result:', photoIdsResult);

    if (photoIdsResult.length === 0) {
      console.log('[DELETE] Photo not found for the specified family:', { familyId, photo_id });
      await connection.end();
      return res.status(404).json({ message: 'Photo not found for the specified family' });
    }

    const photoId = photoIdsResult[0].photo_id;
    console.log('[DELETE] Photo ID to be deleted:', photoId);

    // Шаг 3: Удаление фото из family_photos
    const deleteFamilyPhotosQuery = 'DELETE FROM family_photos WHERE family_id = ? AND photo_id = ?';
    console.log('[DELETE] Deleting photo from family_photos table:', { familyId, photoId });
    const [deleteFamilyPhotosResult]: [any, any] = await connection.execute(deleteFamilyPhotosQuery, [familyId, photoId]);
    console.log('[DELETE] Delete result:', deleteFamilyPhotosResult);

    // Проверка успешности удаления
    if (deleteFamilyPhotosResult.affectedRows === 0) {
      console.log('[DELETE] No rows were deleted, something went wrong.');
      await connection.end();
      return res.status(500).json({ message: 'Failed to delete the photo' });
    }

    await connection.end();
    console.log('[DELETE] Connection closed');

    return res.status(200).json({ message: 'Selection deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE] Database query error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export default handler;
