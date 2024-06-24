import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket } from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const {
    class_id,
    family_name,
    photo_chronicle,
    vignette,
    photo_10x15,
    photo_20x30
  } = req.body;

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const familyIdQuery = 'SELECT id FROM families WHERE family_name = ? AND class_id = (SELECT id FROM classes WHERE class_name = ?)';
    const [familyIdResult] = await connection.execute<RowDataPacket[]>(familyIdQuery, [family_name, class_id]);

    if (familyIdResult.length === 0) {
      connection.end();
      return res.status(404).json({ message: 'Family not found' });
    }

    const familyId = familyIdResult[0].id;

    const insertQuery = `
      INSERT INTO family_photos (family_id, photo_id, photo_chronicle, vignette, photo_size, photo_count)
      VALUES 
      (?, ?, ?, ?, '10x15', ?), 
      (?, ?, ?, ?, '20x30', ?)
    `;

    await connection.execute(insertQuery, [
      familyId, 1, photo_chronicle, vignette, photo_10x15, // photo_id для '10x15' = 1
      familyId, 2, photo_chronicle, vignette, photo_20x30  // photo_id для '20x30' = 2
    ]);

    connection.end();
    return res.status(200).json({ message: 'Selection saved successfully' });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;
