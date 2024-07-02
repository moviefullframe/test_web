import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket } from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Only DELETE requests allowed' });
  }

  const { class_id, family_name, photo_id } = req.body;

  if (!class_id || !family_name || !photo_id) {
    console.log('Missing parameters:', { class_id, family_name, photo_id });
    return res.status(400).json({ message: 'Class ID, family name, and photo ID are required' });
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

    const familyIdQuery = 'SELECT id FROM families WHERE family_name = ? AND class_id = ?';
    console.log('Executing query:', familyIdQuery, [family_name, class_id]);
    const [familyIdResult]: [RowDataPacket[], any] = await connection.execute(familyIdQuery, [family_name, class_id]);

    if (familyIdResult.length === 0) {
      console.log('Family not found for family_name:', family_name);
      await connection.end();
      return res.status(404).json({ message: 'Family not found' });
    }

    const familyId = familyIdResult[0].id;
    console.log('Family ID:', familyId);

    const photoIdsQuery = 'SELECT photo_id FROM family_photos WHERE family_id = ? AND photo_id = ?';
    console.log('Executing query:', photoIdsQuery, [familyId, photo_id]);
    const [photoIdsResult]: [RowDataPacket[], any] = await connection.execute(photoIdsQuery, [familyId, photo_id]);

    console.log('[DELETE] photoIdsQuery result:', photoIdsResult);

    if (photoIdsResult.length === 0) {
      console.log('Photo not found for the specified family:', { familyId, photo_id });
      await connection.end();
      return res.status(404).json({ message: 'Photo not found for the specified family' });
    }

    const photoId = photoIdsResult[0].photo_id;
    console.log('[DELETE] Photo ID to be deleted:', photoId);

    const deleteFamilyPhotosQuery = 'DELETE FROM family_photos WHERE family_id = ? AND photo_id = ?';
    console.log('Executing query:', deleteFamilyPhotosQuery, [familyId, photoId]);
    const [deleteFamilyPhotosResult]: [any, any] = await connection.execute(deleteFamilyPhotosQuery, [familyId, photoId]);
    console.log('[DELETE] Deleted from family_photos:', deleteFamilyPhotosResult);

    const deletePhotoMappingsQuery = 'DELETE FROM photo_mappings WHERE photo_id = ?';
    console.log('Executing query:', deletePhotoMappingsQuery, [photoId]);
    const [deletePhotoMappingsResult]: [any, any] = await connection.execute(deletePhotoMappingsQuery, [photoId]);
    console.log('[DELETE] Deleted from photo_mappings:', deletePhotoMappingsResult);

    await connection.end();
    console.log('[DELETE] Connection closed');

    return res.status(200).json({ message: 'Selection deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE] Database query error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export default handler;
