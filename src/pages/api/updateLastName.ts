import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket } from 'mysql2/promise';  // Удаляем неиспользуемый импорт FieldPacket
import { ResultSetHeader } from 'mysql2';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { photo_id, lastName, class_id } = req.body;

    console.log('Received request to update last name:', { photo_id, lastName, class_id });

    if (!photo_id || !lastName || !class_id) {
        console.error('Photo ID, last name, or class ID is missing:', { photo_id, lastName, class_id });
        return res.status(400).json({ message: 'Photo ID, last name, and class ID are required' });
    }

    try {
        const connection = await mysql.createConnection({
            host: 'photofomin26.synology.me',
            user: 'Admin_Oleg',
            password: 'Av240832012!',
            database: 'school',
            port: 3306,
        });

        console.log('Connected to the database.');

        // Обновляем фамилию в таблице photo_mappings
        const [updateResult] = await connection.execute<ResultSetHeader>(
            `UPDATE photo_mappings SET family_name = ? WHERE id = ?`,
            [lastName, photo_id]
        );

        if (updateResult.affectedRows === 0) {
            console.error('No rows affected. Photo not found:', { photo_id });
            await connection.end();
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Проверяем, существует ли уже запись в families
        const [existingFamily]: [RowDataPacket[], any] = await connection.execute(
            `SELECT id FROM families WHERE family_name = ? AND class_id = ?`,
            [lastName, class_id]
        );

        if (existingFamily.length === 0) {
            // Если запись не существует, вставляем новую
            await connection.execute<ResultSetHeader>(
                `INSERT INTO families (family_name, class_id) VALUES (?, ?)`,
                [lastName, class_id]
            );
            console.log('Inserted new family into families table:', { lastName, class_id });
        } else {
            console.log('Family already exists in families table:', { lastName, class_id });
        }

        await connection.end();

        console.log('Last name updated successfully for photo_id:', photo_id);
        return res.status(200).json({ message: 'Last name updated successfully' });
    } catch (error) {
        console.error('Error updating last name:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export default handler;
