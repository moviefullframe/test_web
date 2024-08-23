import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import styles from '../app/Gallery.module.css';
import LastNameModal from '../components/LastNameModal';
import usePhotoStore from '../store/photoStore'; // Импорт Zustans store
import { Photo } from '../types'; // Убедитесь, что тип Photo импортирован корректно

const PhotoIdentification = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedPhoto = usePhotoStore(state => state.selectedPhoto); // Получаем переменную selectedPhoto из Zustand store
  const setSelectedPhoto = usePhotoStore(state => state.setSelectedPhoto); // Получаем функцию для установки selectedPhoto из Zustand store
  const router = useRouter();

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

        if (!storedUser || !storedUser.id) {
          router.push('/login');
          return;
        }

        const folderPath = `schools/${storedUser.school_name}/${storedUser.class_name}`;

        const res = await axios.get(`/api/getFolderContents`, {
          params: {
            bucketName: 'testphoto2',
            folderPath,
            classId: storedUser.id,
            singlePhotoPerFolder: 'true',
          },
        });

        console.log('Fetched photos:', res.data);

        const photosWithLastName = res.data.map((photo: any) => ({
          ...photo,
          lastName: photo.lastName || '', // Убедитесь, что фамилия корректно отображается
        }));

        console.log('Photos with last names:', photosWithLastName);

        setPhotos(photosWithLastName);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching photos:', error);
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [router]);

  const handleLastNameConfirm = async (lastName: string) => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (selectedPhoto && selectedPhoto.photo_id !== null) {
      console.log('Updating photo with new last name:', {
        photo_id: selectedPhoto.photo_id,
        lastName,
        class_id: storedUser.id,
      });

      const updatedPhotos = photos.map(photo =>
        photo.id === selectedPhoto.id ? { ...photo, lastName } : photo
      );
      setPhotos(updatedPhotos);

      try {
        const response = await axios.post('/api/updateLastName', {
          photo_id: selectedPhoto.photo_id,
          lastName,
          class_id: storedUser.id,
        });

        console.log('Server response for last name update:', response.data);
      } catch (error) {
        console.error('Error updating last name:', error);
      }
    } else {
      console.error('Photo ID is missing or invalid for selected photo:', selectedPhoto);
    }

    setIsModalOpen(false);
  };

  const handleCancelSelection = async (photo: Photo) => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    const updatedPhotos = photos.map(p =>
      p.id === photo.id ? { ...p, lastName: undefined } : p
    );
    setPhotos(updatedPhotos);

    try {
      console.log('Sending data to delete last name:', {
        photo_id: photo.photo_id,
        lastName: photo.lastName,
        class_id: storedUser.id,
      });

      await axios.post('/api/deleteLastName', {
        photo_id: photo.photo_id,
        lastName: photo.lastName,
        class_id: storedUser.id,
      });
    } catch (error) {
      console.error('Error deleting last name:', error);
    }
  };

  const handlePhotoClick = (photoId: number, lastName?: string) => {
    const selectedPhoto = photos.find(photo => photo.id === photoId);

    if (lastName && selectedPhoto) {
      handleCancelSelection(selectedPhoto);
    } else if (selectedPhoto) {
      setSelectedPhoto(selectedPhoto); // Устанавливаем выбранное фото в Zustand store
      setIsModalOpen(true); // Открываем модальное окно
    } else {
      console.error('Photo not found for ID:', photoId); // Логирование ошибки, если фото не найдено
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  console.log('Rendering photos:', photos);

  return (
    <div className={styles.galleryContainer}>
      <h1>Идентификация Фото для {JSON.parse(localStorage.getItem('user') || '{}').school_name}</h1>
      
      {/* Добавляем кнопку "Перейти к выбору фото" */}
      <button
        className={styles.button} // Используем существующий класс для кнопки
        onClick={() => router.push('/galery')} // Переход на страницу "galery"
        style={{ position: 'absolute', top: '20px', right: '20px' }} // Стили для позиционирования
      >
        Перейти к выбору фото
      </button>

      <div className={styles.galleryGrid}>
        {photos.map((photo) => (
          <div key={photo.id} className={styles.galleryItem}>
            <img src={photo.src} alt={photo.alt} className={styles.photo} />
            {photo.lastName && (
              <div className={styles.selectedOverlay}>
                <div className={styles.selectedTextContainer}>
                  <span className={styles.title}>{photo.lastName}</span>
                </div>
              </div>
            )}
            <button
              className={styles.button}
              onClick={() => handlePhotoClick(photo.id, photo.lastName)}
            >
              {photo.lastName ? 'Отменить выбор' : 'Выбрать фамилию'}
            </button>
          </div>
        ))}
      </div>
      <LastNameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLastNameConfirm}
      />
    </div>
  );
};

export default PhotoIdentification;
