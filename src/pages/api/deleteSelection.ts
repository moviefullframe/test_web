import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket } from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Only DELETE requests allowed' });
  }

  const { class_id, family_name } = req.body;

  if (!class_id || !family_name) {
    return res.status(400).json({ message: 'Class ID and family name are required' });
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

    const familyIdQuery = `
      SELECT f.id FROM families f
      JOIN classes c ON f.class_id = c.id
      WHERE f.family_name = ? AND c.class_name = ?
    `;
    const [familyIdResult] = await connection.execute<RowDataPacket[]>(familyIdQuery, [family_name, class_id]);

    console.log('[DELETE] familyIdQuery result:', familyIdResult);

    if (familyIdResult.length === 0) {
      connection.end();
      return res.status(404).json({ message: 'Family not found' });
    }

    const familyId = familyIdResult[0].id;

    const photoIdsQuery = 'SELECT photo_id FROM family_photos WHERE family_id = ?';
    const [photoIdsResult] = await connection.execute<RowDataPacket[]>(photoIdsQuery, [familyId]);

    const photoIds = photoIdsResult.map((row: any) => row.photo_id);
    console.log('[DELETE] Photo IDs to be deleted:', photoIds);

    if (photoIds.length > 0) {
      const deleteFamilyPhotosQuery = 'DELETE FROM family_photos WHERE family_id = ?';
      const [deleteFamilyPhotosResult] = await connection.execute(deleteFamilyPhotosQuery, [familyId]);
      console.log('[DELETE] Deleted family photos result:', deleteFamilyPhotosResult);

      if (photoIds.length > 0) {
        const deleteFileNamesQuery = `DELETE FROM file_names WHERE id IN (${photoIds.join(',')})`;
        const [deleteFileNamesResult] = await connection.execute(deleteFileNamesQuery);
        console.log('[DELETE] Deleted file names result:', deleteFileNamesResult);
      } else {
        console.log('[DELETE] No photo IDs found for family_id:', familyId);
      }
    } else {
      console.log('[DELETE] No photos found for family_id:', familyId);
    }

    connection.end();
    console.log('[DELETE] Connection closed');

    return res.status(200).json({ message: 'Selection deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE] Database query error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export default handler;
