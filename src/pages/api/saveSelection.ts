import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    class_id,
    family_name,
    photo_id,
    photo_chronicle,
    vignette,
    photo_10x15_count,
    photo_20x30_count,
    photo10x15Name,
    photo20x30Name,
    album
  } = req.body;

  console.log('Received data:', req.body);

  const connection = await mysql.createConnection({
    host: 'photofomin26.synology.me',
    user: 'Admin_Oleg',
    password: 'Av240832012!',
    database: 'school',
    port: 3306,
  });

  try {
    console.log('Database connection established');

    // Get family_id from families table
    const [familyRows]: [any[], any] = await connection.execute(
      `SELECT id FROM families WHERE family_name = ? AND class_id = ?`,
      [family_name, class_id]
    );

    if (familyRows.length === 0) {
      throw new Error('Family not found');
    }

    const family_id = familyRows[0].id;
    console.log('Family ID:', family_id);

    // Ensure photo_id exists in photo_mappings
    const [mappingRows]: [any[], any] = await connection.execute(
      `SELECT id FROM photo_mappings WHERE cloud_id = ?`,
      [photo10x15Name]
    );

    let photoMappingId = photo_id;

    if (mappingRows.length === 0) {
      const [result]: [mysql.ResultSetHeader, any] = await connection.execute(
        `INSERT INTO photo_mappings (cloud_id, file_name) VALUES (?, ?)`,
        [photo10x15Name, photo10x15Name]
      );
      photoMappingId = result.insertId;
      console.log('New photo_id inserted into photo_mappings:', photoMappingId);
    } else {
      photoMappingId = mappingRows[0].id;
      console.log('Existing photo_id fetched from photo_mappings:', photoMappingId);
    }

    // Insert into family_photos table
    const query = `
      INSERT INTO family_photos (family_id, photo_id, photo_chronicle, vignette, photo_size, photo_count, file_name_id, album, class_id)
      VALUES
      (?, ?, ?, ?, '10x15', ?, ?, ?, ?),
      (?, ?, ?, ?, '20x30', ?, ?, ?, ?)
    `;

    const params = [
      family_id, photoMappingId, photo_chronicle, vignette, photo_10x15_count, photoMappingId, album, class_id,
      family_id, photoMappingId, photo_chronicle, vignette, photo_20x30_count, photoMappingId, album, class_id
    ];

    console.log('Insert parameters:', params);

    await connection.execute(query, params);
    console.log('Data inserted into family_photos successfully');

    await connection.end();
    return res.status(200).json({ message: 'Selection saved successfully' });
  } catch (error) {
    console.error('Database query error:', error);
    await connection.end();
    return res.status(500).json({ message: 'Internal server error' });
  }
}
