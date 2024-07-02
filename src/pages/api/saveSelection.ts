import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

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
    album,
  } = req.body;

  if (
    !class_id ||
    !family_name ||
    photo_id === undefined ||
    photo_chronicle === undefined ||
    vignette === undefined ||
    photo_10x15_count === undefined ||
    photo_20x30_count === undefined ||
    !photo10x15Name ||
    !photo20x30Name ||
    album === undefined
  ) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const [familyRows] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM families WHERE family_name = ? AND class_id = ?`,
      [family_name, class_id]
    );

    let family_id;
    if (familyRows.length > 0) {
      family_id = familyRows[0].id;
    } else {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO families (family_name, class_id) VALUES (?, ?)`,
        [family_name, class_id]
      );
      family_id = result.insertId;
    }

    console.log('Family ID:', family_id);

    const [photo10x15Rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM photo_mappings WHERE file_name = ?`,
      [photo10x15Name]
    );
    const [photo20x30Rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM photo_mappings WHERE file_name = ?`,
      [photo20x30Name]
    );

    const photo10x15Id = photo10x15Rows.length > 0 ? photo10x15Rows[0].id : null;
    const photo20x30Id = photo20x30Rows.length > 0 ? photo20x30Rows[0].id : null;

    if (!photo10x15Id || !photo20x30Id) {
      return res.status(500).json({ message: 'Photo ID not found' });
    }

    const [insertResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO family_photos (family_id, photo_id, photo_chronicle, vignette, photo_size, photo_count, album, class_id)
       VALUES
       (?, ?, ?, ?, '10x15', ?, ?, ?),
       (?, ?, ?, ?, '20x30', ?, ?, ?)`,
      [
        family_id, photo_id, photo_chronicle, vignette, photo_10x15_count, album, class_id,
        family_id, photo_id, photo_chronicle, vignette, photo_20x30_count, album, class_id
      ]
    );

    console.log('New photo_id inserted into family_photos:', insertResult.insertId);

    await connection.end();

    return res.status(200).json({ message: 'Selection saved successfully' });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
