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
  const { bucketName, folderPath } = req.query;

  if (!bucketName || !folderPath) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const params = {
    Bucket: bucketName as string,
    Prefix: folderPath as string,
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

    const photos = await Promise.all(data.Contents.map(async item => {
      if (!item.ETag) {
        console.warn(`Skipping item without ETag: ${item.Key}`);
        return null;
      }

      const photo = {
        id: item.ETag.replace(/"/g, ''), // Убираем кавычки из ETag
        src: `https://${bucketName}.storage.yandexcloud.net/${item.Key}`,
        alt: item.Key || 'No description',
        photoSize: item.Size ? `${item.Size} bytes` : 'unknown',
        photoType: item.Key ? item.Key.split('.').pop() || 'unknown' : 'unknown',
        photo_id: null as number | null,
      };

      console.log('Processing photo:', photo);

      const [rows]: [any[], any] = await connection.execute(
        `SELECT id AS photo_id FROM photo_mappings WHERE cloud_id = ?`,
        [photo.id]
      );

      console.log('Rows fetched from photo_mappings:', rows);

      if (rows.length > 0) {
        photo.photo_id = rows[0].photo_id;
        console.log('Existing photo_id found:', photo.photo_id);
      } else {
        const [result]: [mysql.ResultSetHeader, any] = await connection.execute(
          `INSERT INTO photo_mappings (cloud_id, file_name) VALUES (?, ?)`,
          [photo.id, photo.alt]
        );
        const newPhotoId = result.insertId;
        await connection.execute(
          `UPDATE photo_mappings SET photo_id = ? WHERE id = ?`,
          [newPhotoId, newPhotoId]
        );
        photo.photo_id = newPhotoId;
        console.log('New photo_id inserted:', photo.photo_id);
      }

      return photo;
    }));

    const validPhotos = photos.filter(photo => photo !== null);

    await connection.end();

    console.log('Final photos array:', validPhotos);

    return res.status(200).json(validPhotos);
  } catch (error) {
    console.error('Error fetching folder contents from Yandex Cloud:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
