import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    class_id,
    family_name,
    photo_id,
    photo_size,
    photo_count = 0,
    photo_chronicle = 0,
    vignette = 0,
    album = 0,
    all_photos_digital = 0,
    portrait_album_2 = 0,
    portrait_album_3 = 0,
    single_photo_digital = 0,
    photo_in_cube = 0,
    file_name_id
  } = req.body;

  console.log('Received body:', req.body);

  if (
    typeof class_id === 'undefined' ||
    typeof family_name === 'undefined' ||
    typeof photo_id === 'undefined' ||
    typeof photo_size === 'undefined' ||
    typeof photo_count === 'undefined' ||
    typeof photo_chronicle === 'undefined' ||
    typeof vignette === 'undefined' ||
    typeof album === 'undefined' ||
    typeof all_photos_digital === 'undefined' ||
    typeof portrait_album_2 === 'undefined' ||
    typeof portrait_album_3 === 'undefined' ||
    typeof single_photo_digital === 'undefined' ||
    typeof photo_in_cube === 'undefined' ||
    typeof file_name_id === 'undefined'
  ) {
    console.error('Missing required parameters:', {
      class_id,
      family_name,
      photo_id,
      photo_size,
      photo_count,
      photo_chronicle,
      vignette,
      album,
      all_photos_digital,
      portrait_album_2,
      portrait_album_3,
      single_photo_digital,
      photo_in_cube,
      file_name_id
    });
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

    const [insertResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO family_photos (family_id, photo_id, photo_size, photo_count, photo_chronicle, vignette, album, class_id, all_photos_digital, portrait_album_2, portrait_album_3, single_photo_digital, photo_in_cube, file_name_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [family_id, photo_id, photo_size, photo_count, photo_chronicle, vignette, album, class_id, all_photos_digital, portrait_album_2, portrait_album_3, single_photo_digital, photo_in_cube, file_name_id]
    );

    console.log('New photo_id inserted into family_photos:', insertResult.insertId);

    await connection.end();

    return res.status(200).json({ message: 'Selection saved successfully' });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
