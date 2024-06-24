import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket } from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Only DELETE requests allowed' });
  }

  const { class_id, family_name } = req.body;

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const familyIdQuery = `
      SELECT f.id FROM families f
      JOIN classes c ON f.class_id = c.id
      WHERE f.family_name = ? AND c.class_name = ?
    `;
    const [familyIdResult] = await connection.execute<RowDataPacket[]>(familyIdQuery, [family_name, class_id]);

    if (familyIdResult.length === 0) {
      connection.end();
      return res.status(404).json({ message: 'Family not found' });
    }

    const familyId = familyIdResult[0].id;

    const deleteQuery = 'DELETE FROM family_photos WHERE family_id = ?';
    await connection.execute(deleteQuery, [familyId]);

    connection.end();
    return res.status(200).json({ message: 'Selection deleted successfully' });
  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;
