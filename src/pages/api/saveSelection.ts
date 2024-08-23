import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {
        class_id,
        family_name,
        photo_id,
        photo_10x15,
        photo_15x21,
        photo_20x30,
        photo_count,
        photo_chronicle = 0,
        vignette = 0,
        album = 0,
        album_selection,
        all_photos_digital = 0,
        portrait_album_2 = 0,
        portrait_album_3 = 0,
        single_photo_digital = 0,
        photo_in_cube = 0
    } = req.body;

    console.log('Received body:', req.body);

    // Проверка на наличие обязательных параметров
    if (
        typeof class_id === 'undefined' ||
        typeof family_name === 'undefined' ||
        typeof photo_id === 'undefined' ||  
        typeof photo_count === 'undefined' ||
        typeof album_selection === 'undefined'    
    ) {
        console.error('Missing required parameters:', req.body);
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

        console.log('Connected to the database.');

        // Получение соответствия cloud_id и photo_id из photo_mappings
        const [photoMappingRows] = await connection.execute<RowDataPacket[]>(
            `SELECT id as photo_id FROM photo_mappings WHERE cloud_id = ?`,
            [photo_id]
        );

        if (photoMappingRows.length === 0) {
            console.error('photo_id not found in photo_mappings for cloud_id:', photo_id);
            return res.status(400).json({ message: 'Invalid photo_id' });
        }

        const photoIdNum = photoMappingRows[0].photo_id;
        console.log('photo_id retrieved from photo_mappings:', photoIdNum);

        // Получение file_name_id из той же таблицы
        const fileNameIdNum = photoIdNum; // Поскольку `photo_id` и `file_name_id` должны быть равны

        const [familyRows] = await connection.execute<RowDataPacket[]>(
            `SELECT id FROM families WHERE family_name = ? AND class_id = ?`,  
            [family_name, class_id]
        );

        let familyId: number;
        if (familyRows.length > 0) {
            familyId = familyRows[0].id;
            console.log('Family found, ID:', familyId);
        } else {
            const [insertFamilyResult] = await connection.execute<ResultSetHeader>(  
                `INSERT INTO families (family_name, class_id) VALUES (?, ?)`,
                [family_name, class_id]  
            );
            familyId = insertFamilyResult.insertId;
            console.log('New family inserted, ID:', familyId);
        }

        console.log('Family ID to be used:', familyId);

        const [insertResult] = await connection.execute<ResultSetHeader>(
            `INSERT INTO family_photos (
                family_id, photo_id, photo_10x15, photo_15x21, photo_20x30, 
                photo_count, photo_chronicle, vignette, album, album_selection,
                class_id, all_photos_digital, portrait_album_2, portrait_album_3,
                single_photo_digital, photo_in_cube, file_name_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                familyId,
                photoIdNum, 
                photo_10x15 ?? 0,
                photo_15x21 ?? 0,  
                photo_20x30 ?? 0,
                photo_count,
                photo_chronicle,
                vignette,
                album,
                album_selection, 
                class_id,
                all_photos_digital,
                portrait_album_2, 
                portrait_album_3,
                single_photo_digital,
                photo_in_cube,
                fileNameIdNum // Используем правильный file_name_id
            ]
        );

        console.log('New record inserted into family_photos:', insertResult.insertId);

        await connection.end();
        console.log('Database connection closed.');

        return res.status(200).json({ 
            message: 'Selection saved successfully',
            data: insertResult
        });
    } catch (error: any) {
        console.error('Database query error:', error); 
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
