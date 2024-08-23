import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { classId, lastName, schoolName, className } = req.query;

    console.log('Received request with params:', { classId, lastName, schoolName, className });

    if (!classId || !lastName) {
        console.error('Missing required parameters:', { classId, lastName });
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

        console.log('MySQL connection established.');

        let query = `SELECT photo_id, file_name FROM photo_mappings WHERE class_id = ?`;
        let queryParams: any[] = [classId];

        if (lastName !== "Все") {
            query += ` AND family_name = ?`;
            queryParams.push(lastName);
        }
        console.log('Executing query:', query, 'with params:', queryParams);

        // Получаем photo_id и file_name из таблицы photo_mappings на основе classId и lastName
        const [rows]: [any[], any] = await connection.execute(query, queryParams);

        console.log('Photo IDs and file names fetched from photo_mappings:', rows);

        if (rows.length === 0) {
            console.error('No photo IDs or file names found for the specified last name and class ID.');
            await connection.end();
            return res.status(404).json({ message: 'No photo IDs or file names found' });
        }

        let uniqueFolders;

        if (lastName === "Все") {
            // Если выбрано "Все", формируем путь на основе школы и класса
            uniqueFolders = [`schools/${schoolName}/${className}`];
            console.log('Dynamic path generated for "Все":', uniqueFolders);
        } else {
            // Обрабатываем file_name для получения уникальных папок
            uniqueFolders = Array.from(new Set(rows.map(row => {
                if (!row.file_name) {
                    console.error('file_name is undefined for row:', row);
                    return null;
                }
                const pathParts = row.file_name.split('/');
                pathParts.pop(); // Убираем имя файла, оставляя только путь до папки
                return pathParts.join('/');
            }).filter(Boolean))); // Удаляем любые null значения из массива
        }

        await connection.end();
        console.log('MySQL connection closed.');
        console.log('Unique folders returned:', uniqueFolders);

        return res.status(200).json({ folders: uniqueFolders });
    } catch (error) {
        console.error('Error fetching paths from database:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
