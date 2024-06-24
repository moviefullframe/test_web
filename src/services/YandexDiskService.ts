import axios from 'axios';

const YANDEX_DISK_API_URL = 'https://cloud-api.yandex.net/v1/disk/resources';
const TOKEN = 'y0_AgAAAAASYIaAAAv8BgAAAAEIHOKZAADsV1fr7GBFnbg8zf6clQDNjwTGWw';

const YandexDiskService = {
  async getFolderContents(folderPath: string) {
    try {
      const response = await axios.get(`${YANDEX_DISK_API_URL}?path=${folderPath}`, {
        headers: {
          Authorization: `OAuth ${TOKEN}`,
        },
      });
      return response.data._embedded.items;
    } catch (error) {
      console.error('Error fetching folder contents from Yandex Disk:', error);
      return [];
    }
  },
};

export default YandexDiskService;
