import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({ message: 'IDs are required' });
  }

  const idArray = (ids as string).split(',').map(id => parseInt(id, 10));

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const [nameRows] = await connection.execute(
      `SELECT id, file_name
       FROM file_names
       WHERE id IN (?)`,
      [idArray]
    );

    await connection.end();

    if (Array.isArray(nameRows) && nameRows.length > 0) {
      return res.status(200).json(nameRows);
    } else {
      return res.status(404).json({ message: 'File names not found' });
    }
  } catch (error) {
    console.error('Error fetching file names:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;
