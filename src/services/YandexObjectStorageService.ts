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

const YandexObjectStorageService = {
  async getFolderContents(bucketName: string, folderPath: string) {
    const params = {
      Bucket: 'testphoto2',
      Prefix: folderPath,
    };

    try {
      const data = await s3Client.send(new ListObjectsV2Command(params));
      if (!data.Contents) {
        console.error('No contents found in the specified bucket and folder path.');
        return [];
      }

      const connection = await mysql.createConnection({
        host: 'photofomin26.synology.me',
        user: 'Admin_Oleg',
        password: 'Av240832012!',
        database: 'school',
        port: 3306,
      });

      const photos = await Promise.all(data.Contents.map(async item => {
        const photo = {
          id: item.ETag,
          src: `https://testphoto2.storage.yandexcloud.net/${item.Key}`,
          alt: item.Key || 'No description',
          photoSize: item.Size ? `${item.Size} bytes` : 'unknown',
          photoType: item.Key ? item.Key.split('.').pop() || 'unknown' : 'unknown',
          photo_id: null as number | null, // добавляем поле photo_id
        };

        const [rows]: [any[], any] = await connection.execute(
          `SELECT photo_id FROM photo_mappings WHERE cloud_id = ?`,
          [photo.id]
        );
        if (rows.length > 0) {
          photo.photo_id = rows[0].photo_id;
        } else {
          // Insert the new mapping if it doesn't exist
          const [result]: [mysql.ResultSetHeader, any] = await connection.execute(
            `INSERT INTO photo_mappings (cloud_id, file_name) VALUES (?, ?)`,
            [photo.id, photo.alt]
          );
          photo.photo_id = result.insertId;
        }

        return photo;
      }));

      await connection.end();

      return photos;
    } catch (error) {
      console.error('Error fetching folder contents from Yandex Cloud:', error);
      return [];
    }
  },
};

export default YandexObjectStorageService;
