import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, ListObjectsV2Command, S3ServiceException } from "@aws-sdk/client-s3";
import mysql, { RowDataPacket } from 'mysql2/promise';

const s3Client = new S3Client({
  endpoint: 'https://storage.yandexcloud.net',
  region: 'ru-central1',
  credentials: {
    accessKeyId: 'YCAJEwGzBqcYG8Q9euGwvwyuq',
    secretAccessKey: 'YCOzo32NzKfJosdk5mKfArbcP53pKeIpi8csZRH-',
  },
});

interface PhotoMapping extends RowDataPacket {
  id: number;
  photo_id: number;
  cloud_id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { bucketName, folderPath } = req.query;

  if (!bucketName || !folderPath) {
    console.log('Missing required parameters:', { bucketName, folderPath });
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const params = {
    Bucket: bucketName as string,
    Prefix: folderPath as string,
  };

  let data;
  try {
    console.log('Отправка запроса в Yandex Cloud с параметрами:', params);
    data = await s3Client.send(new ListObjectsV2Command(params));
    console.log('Полученные данные из Yandex Cloud:', data);
} catch (error) {
    if (error instanceof S3ServiceException && (error.name === 'NoSuchBucket' || error.name === 'NotFound')) {
        console.error('Содержимое не найдено в указанной папке.');
        data = { Contents: [] }; 
    } else {
        console.error('Ошибка при получении содержимого папки из Yandex Cloud:', error);
        return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }

  }

  try {
    const connection = await mysql.createConnection({
      host: 'photofomin26.synology.me',
      user: 'Admin_Oleg',
      password: 'Av240832012!',
      database: 'school',
      port: 3306,
    });

    console.log('Connected to the database');

    const [existingPhotos]: [PhotoMapping[], any] = await connection.execute(
      `SELECT id, photo_id, cloud_id FROM photo_mappings WHERE file_name LIKE ?`,
      [`%${folderPath}%`]
    );
    const existingPhotoIds = existingPhotos.map((photo) => photo.photo_id);
    const existingCloudIds = existingPhotos.map((photo) => photo.cloud_id);

    console.log('Existing photos fetched from the database:', existingPhotoIds);
    console.log('Existing cloud IDs fetched from the database:', existingCloudIds);

    if (!data.Contents || data.Contents.length === 0) {
  
      console.log('Attempting to delete all related photo_ids:', existingPhotoIds);
      if (existingPhotoIds.length > 0) {
        await connection.execute(`DELETE FROM photo_mappings WHERE photo_id IN (?)`, [existingPhotoIds]);
        console.log('Deleted all photo_ids:', existingPhotoIds);
      } else {
        console.log('No photos to delete.');
      }

      await connection.end();
      return res.status(404).json({ message: 'No contents found' });
    }

    
    const validPhotos: string[] = data.Contents.map(item => item.ETag?.replace(/"/g, '')).filter(Boolean) as string[];
    const validPhotoIds = data.Contents
      .filter(item => item.Key !== undefined) 
      .map(item => parseInt(item.Key!.split('/').pop()?.split('.')[0] || '0')).filter(Boolean);

    console.log('Valid photos from Yandex Cloud:', validPhotos);
    console.log('Valid photo IDs from Yandex Cloud:', validPhotoIds);

  
    console.log('photo_id in database:', existingPhotoIds);
    console.log('photo_id on Yandex:', validPhotoIds);
    console.log('cloud_id in database:', existingCloudIds);
    console.log('cloud_id on Yandex:', validPhotos);

  
    const photosToDelete = existingPhotoIds.filter((id) => !validPhotoIds.includes(id));
    if (photosToDelete.length > 0) {
      console.log('Attempting to delete photo_ids:', photosToDelete);
      const [result] = await connection.execute(`DELETE FROM photo_mappings WHERE photo_id IN (?)`, [photosToDelete]);
      console.log('Delete result:', result);
    } else {
      console.log('No photos to delete.');
    }

    
    const cloudIdsToDelete = existingCloudIds.filter((cloud_id) => !validPhotos.includes(cloud_id));
    if (cloudIdsToDelete.length > 0) {
      console.log('Attempting to delete cloud_ids:', cloudIdsToDelete);
      const [result] = await connection.execute(`DELETE FROM photo_mappings WHERE cloud_id IN (?)`, [cloudIdsToDelete]);
      console.log('Delete result for cloud_ids:', result);
    } else {
      console.log('No cloud_ids to delete.');
    }

   
    for (const item of data.Contents) {
      if (!item.ETag || !item.Key) {
        console.warn(`Skipping item without ETag or Key: ${item.Key}`);
        continue;
      }

      const photo = {
        id: item.ETag.replace(/"/g, ''), 
        src: `https://${bucketName}.storage.yandexcloud.net/${item.Key}`,
        alt: item.Key || 'No description',
        photoSize: item.Size ? `${item.Size} bytes` : 'unknown',
        photoType: item.Key ? item.Key.split('.').pop() || 'unknown' : 'unknown',
        photo_id: parseInt(item.Key.split('/').pop()?.split('.')[0] || '0'), 
      };

      console.log('Processing photo:', photo);
      

      const [rows]: [PhotoMapping[], any] = await connection.execute(
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
        const [newRow]: [PhotoMapping[], any] = await connection.execute(
          `SELECT id AS photo_id FROM photo_mappings WHERE cloud_id = ?`,
          [photo.id]
        );
        photo.photo_id = newRow[0].photo_id;
        console.log('New photo_id inserted:', photo.photo_id);
      }
    }

    await connection.end();

    console.log('Final photos array:', validPhotos);

    return res.status(200).json(validPhotos);
  } catch (error) {
    console.error('Error processing database operations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
