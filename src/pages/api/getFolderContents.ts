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

type Photo = {
  id: string;
  src: string;
  alt: string;
  photoSize: string;
  photoType: string;
  photo_id: number | null;
  lastName?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bucketName, folderPath, classId, singlePhotoPerFolder } = req.query;

  console.log('Received parameters:', { bucketName, folderPath, classId, singlePhotoPerFolder });

  if (!bucketName || !folderPath || !classId) {
    console.error('Missing required parameters:', { bucketName, folderPath, classId });
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const params = {
    Bucket: bucketName as string,
    Prefix: (folderPath as string),  };

  try {
    const data = await s3Client.send(new ListObjectsV2Command(params));
    if (!data.Contents) {
      console.error('No contents found in the specified bucket and folder path.');
      return res.status(404).json({ message: 'No contents found' });
    }
    console.log('Decoded folder path:', decodeURIComponent(folderPath as string));

    console.log('Yandex Object Storage data:', data);

    // Фильтрация пустых объектов
    const validContents = data.Contents.filter(item => item.Size !== undefined && item.Size > 0);

    let selectedItems: any[];

    if (singlePhotoPerFolder === 'true') {
      // Группировка по папкам и выбор одного фото из каждой папки
      const groupedItems = validContents.reduce((acc: Record<string, any>, item) => {
        const folderParts = item.Key!.split('/');
        const folder = folderParts.slice(0, folderParts.length - 1).join('/');
        if (!acc[folder]) {
          acc[folder] = item;
        }
        return acc;
      }, {});
      selectedItems = Object.values(groupedItems);
    } else {
      // Возвращаем все фотографии
      selectedItems = validContents;
    }

    console.log("Selected items:", selectedItems);

    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    console.log('MySQL connection established.');

    const photoIds = selectedItems.map((item: any) => item.ETag?.replace(/"/g, '')).filter(Boolean);

    if (photoIds.length === 0) {
      console.error('No valid ETag found.');
      await connection.end();
      return res.status(404).json({ message: 'No valid ETag found' });
    }

    console.log('Photo IDs:', photoIds);

    const placeholders = photoIds.map(() => '?').join(',');
    const [existingRows]: [any[], any] = await connection.execute(
      `SELECT id AS photo_id, cloud_id, family_name AS lastName FROM photo_mappings WHERE cloud_id IN (${placeholders})`,
      photoIds
    );

    console.log('Existing rows from photo_mappings:', existingRows);

    const existingPhotoMap = new Map<string, { photo_id: number, lastName?: string }>(
      existingRows.map(row => [row.cloud_id, { photo_id: row.photo_id, lastName: row.lastName }])
    );

    const photos: (Photo | null)[] = await Promise.all(selectedItems.map(async (item: any) => {
      if (!item.ETag || !item.Key) {
        console.warn(`Skipping item without ETag or Key: ${item.Key}`);
        return null;
      }

      const cloudId = item.ETag.replace(/"/g, '');
      const existingPhotoData = existingPhotoMap.get(cloudId);

      const photo: Photo = {
        id: cloudId,
        src: `https://${bucketName}.storage.yandexcloud.net/${item.Key}`,
        alt: item.Key || 'No description',
        photoSize: item.Size ? `${item.Size} bytes` : 'unknown',
        photoType: item.Key ? item.Key.split('.').pop() || 'unknown' : 'unknown',
        photo_id: existingPhotoData?.photo_id || null,
        lastName: existingPhotoData?.lastName || ''
      };

      const fileNameWithoutExtension = photo.alt.replace(/\.(jpg|JPG)$/, '');

      console.log('Processing photo:', photo);

      if (!existingPhotoData?.photo_id) {
        try {
          const [result]: [mysql.ResultSetHeader, any] = await connection.execute(
            `INSERT INTO photo_mappings (cloud_id, file_name, class_id) VALUES (?, ?, ?)`,
            [photo.id, fileNameWithoutExtension, classId]
          );

          const newPhotoId = result.insertId;
          photo.photo_id = newPhotoId; // Назначение photo_id
          photo.id = newPhotoId.toString()
          await connection.execute(
            `UPDATE photo_mappings SET photo_id = ? WHERE id = ?`,
            [newPhotoId, newPhotoId]
          );

          photo.photo_id = newPhotoId;

          console.log('New photo_id inserted and updated:', photo.photo_id);
        } catch (err) {
          console.error('Error inserting photo:', err);
        }
      } else {
        console.log('Existing photo_id found:', existingPhotoData.photo_id);
      }

      return photo;
    }));

    const validPhotos = photos.filter((photo): photo is Photo => photo !== null);

    console.log('Final photos array:', validPhotos);

    const [rows]: [any[], any] = await connection.execute(
      `SELECT id AS photo_id FROM photo_mappings WHERE class_id = ?`,
      [classId]
    );

    console.log('Rows fetched from photo_mappings:', rows);

    const yandexIds = new Set(validPhotos.map(el => el.photo_id));
    const dbIds = rows.map(el => el.photo_id);

    console.log('Yandex IDs:', yandexIds);
    console.log('Database IDs:', dbIds);



    await connection.end();
    console.log('MySQL connection closed.');

    return res.status(200).json(validPhotos);
  } catch (error) {
    console.error('Error fetching folder contents from Yandex Cloud:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
