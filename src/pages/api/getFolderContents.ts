import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import mysql from 'mysql2/promise';

const s3Client = new S3Client({
  endpoint: 'https://storage.yandexcloud.net',
  region: 'ru-central1',
  credentials: {
    accessKeyId: 'YCAJEwGzBqcYG8Q9euGwvwyuq',
    secretAccessKey: 'YCOzo32NzKfJosdk5mKfArbcP53pKeIpi8csZRH-',
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bucketName, folderPath, classId } = req.query;

  // Логируем параметры запроса
  console.log('Received parameters:', { bucketName, folderPath, classId });

  if (!bucketName || !folderPath || !classId) {
    console.error('Missing required parameters:', { bucketName, folderPath, classId });
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const params = {
    Bucket: bucketName as string,
    Prefix: decodeURIComponent(folderPath as string), // Декодирование параметра folderPath
  };

  try {
    const data = await s3Client.send(new ListObjectsV2Command(params));
    if (!data.Contents) {
      console.error('No contents found in the specified bucket and folder path.');
      return res.status(404).json({ message: 'No contents found' });
    }

    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    const photoIds = data.Contents.map(item => item.ETag?.replace(/"/g, '')).filter(Boolean);

    if (photoIds.length === 0) {
      console.error('No valid ETag found.');
      await connection.end();
      return res.status(404).json({ message: 'No valid ETag found' });
    }

    const placeholders = photoIds.map(() => '?').join(',');
    const [existingRows]: [any[], any] = await connection.execute(
      `SELECT id AS photo_id, cloud_id FROM photo_mappings WHERE cloud_id IN (${placeholders})`,
      photoIds
    );

    const existingPhotoMap = new Map(existingRows.map(row => [row.cloud_id, row.photo_id]));

    const photos = await Promise.all(data.Contents.map(async item => {
      if (!item.ETag) {
        console.warn(`Skipping item without ETag: ${item.Key}`);
        return null;
      }

      const cloudId = item.ETag.replace(/"/g, '');
      const existingPhotoId = existingPhotoMap.get(cloudId);

      const photo = {
        id: cloudId,
        src: `https://${bucketName}.storage.yandexcloud.net/${item.Key}`,
        alt: item.Key || 'No description',
        photoSize: item.Size ? `${item.Size} bytes` : 'unknown',
        photoType: item.Key ? item.Key.split('.').pop() || 'unknown' : 'unknown',
        photo_id: existingPhotoId || null,
      };

      console.log('Processing photo:', photo);

      if (!existingPhotoId) {
        const [result]: [mysql.ResultSetHeader, any] = await connection.execute(
          `INSERT INTO photo_mappings (cloud_id, file_name, class_id) VALUES (?, ?, ?)`,
          [photo.id, photo.alt, classId]
        );
        photo.photo_id = result.insertId;
        console.log('New photo_id inserted:', photo.photo_id);
      } else {
        console.log('Existing photo_id found:', existingPhotoId);
      }

      return photo;
    }));

    const validPhotos = photos.filter(photo => photo !== null);

    console.log('Final photos array:', validPhotos);

    const [rows]: [any[], any] = await connection.execute(
      `SELECT id AS photo_id FROM photo_mappings WHERE class_id = ?`,
      [classId]
    );

    console.log('!!Rows fetched from photo_mappings:', rows);

    const yandexIds = new Set(validPhotos.map(el => el?.photo_id));
    const dbIds = rows.map(el => el.photo_id);

    await Promise.all(dbIds.map(async photoId => {
      if (!yandexIds.has(photoId)) {
        try {
          const deletePhotoMappingsQuery = 'DELETE FROM photo_mappings WHERE id = ?';
          console.log('Executing query:', deletePhotoMappingsQuery, [photoId]);
          const [deletePhotoMappingsResult]: [any, any] = await connection.execute(deletePhotoMappingsQuery, [photoId]);
          console.log('[DELETE] Deleted from photo_mappings:', deletePhotoMappingsResult);
        } catch (err: any) {
          if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            console.warn(`Skipping deletion of photo_id ${photoId} due to existing references.`);
          } else {
            throw err;
          }
        }
      }
    }));

    await connection.end();

    return res.status(200).json(validPhotos);
  } catch (error) {
    console.error('Error fetching folder contents from Yandex Cloud:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
