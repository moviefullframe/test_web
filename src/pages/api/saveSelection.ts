import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const {
    class_id,
    family_name,
    photo_chronicle,
    vignette,
    photo_10x15_count,
    photo_20x30_count,
    photo10x15Name,
    photo20x30Name,
    album,
  } = req.body;

  console.log('Received data:', req.body);

  if (!class_id || !family_name || !photo10x15Name || !photo20x30Name) {
    console.error('Missing required fields');
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  // Убедимся, что значение album всегда либо 0, либо 1
  const albumValue = album ? 1 : 0;

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

    const insertFileNameQuery = `
      INSERT INTO file_names (file_name) VALUES (?),(?)
      ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
    `;
    const [fileNamesResult] = await connection.execute<ResultSetHeader>(insertFileNameQuery, [photo10x15Name, photo20x30Name]);
    const file10x15Id = fileNamesResult.insertId;
    const file20x30Id = fileNamesResult.insertId + 1;

    const insertQuery = `
      INSERT INTO family_photos (family_id, photo_id, photo_chronicle, vignette, photo_size, photo_count, file_name_id, album)
      VALUES
      (?, ?, ?, ?, '10x15', ?, ?, ?),
      (?, ?, ?, ?, '20x30', ?, ?, ?)
    `;

    console.log('Insert parameters:', [
      familyId, file10x15Id, photo_chronicle, vignette, photo_10x15_count, file10x15Id, albumValue,
      familyId, file20x30Id, photo_chronicle, vignette, photo_20x30_count, file20x30Id, albumValue
    ]);

    await connection.execute(insertQuery, [
      familyId, file10x15Id, photo_chronicle, vignette, photo_10x15_count, file10x15Id, albumValue,
      familyId, file20x30Id, photo_chronicle, vignette, photo_20x30_count, file20x30Id, albumValue
    ]);

    connection.end();
    return res.status(200).json({ message: 'Selection saved successfully' });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;
