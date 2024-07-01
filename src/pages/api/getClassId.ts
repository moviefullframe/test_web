// /api/getClassId.ts
import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket } from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { class_name } = req.query;

  if (!class_name) {
    return res.status(400).json({ message: 'Class name is required' });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const query = 'SELECT id FROM classes WHERE class_name = ?';
    const [result] = await connection.execute<RowDataPacket[]>(query, [class_name]);

    if ((result as RowDataPacket[]).length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const class_id = (result as RowDataPacket[])[0].id;
    connection.end();
    return res.status(200).json({ class_id });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Internal server error', error: error.message });
    } else {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export default handler;
