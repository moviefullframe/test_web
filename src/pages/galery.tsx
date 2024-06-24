import { useEffect, useState } from 'react';
import styles from '../app/Gallery.module.css';
import PhotoModal from '../components/PhotoModal';
import LightboxGallery from '../components/LightboxGallery';
import GalleryGrid from '../components/GalleryGrid';
import YandexDiskService from '../services/YandexDiskService';

type Photo = {
  id: number;
  src: string;
  alt: string;
};

type User = {
  class_name: string;
  school_name: string;
};

type SelectedOptions = {
  lastName: string;
  photo10x15: number;
  photo20x30: number;
  photoInYearbook: boolean;
  additionalPhotos: boolean;
  vignette: boolean;
  photo10x15Name: string;
  photo20x30Name: string;
};

const Gallery = () => {
  const [user, setUser] = useState<User>({ class_name: '', school_name: '' });
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    lastName: '',
    photo10x15: 0,
    photo20x30: 0,
    photoInYearbook: false,
    additionalPhotos: false,
    vignette: false,
    photo10x15Name: '',
    photo20x30Name: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      console.log('User loaded from localStorage:', storedUser);
    }
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (user.school_name && user.class_name) {
        const folderPath = `schools/${user.school_name}/${user.class_name}`;
        console.log('Fetching photos from Yandex Disk with folderPath:', folderPath);
        const items = await YandexDiskService.getFolderContents(folderPath);
        console.log('Yandex Disk items fetched:', items);
        const fetchedPhotos = items
          .filter((item: any) => item.type === 'file')
          .map((item: any, index: number) => ({
            id: index + 1,
            src: item.file,
            alt: item.name,
          }));
        setPhotos(fetchedPhotos);
        console.log('Photos fetched from Yandex Disk:', fetchedPhotos);
      }
    };

    fetchPhotos();
  }, [user]);

  const handleSelectPhoto = (photo: Photo | null) => {
    console.log('Photo selected:', photo);
    if (selectedPhoto?.id === photo?.id) {
      setSelectedPhoto(null);
      setSelectedOptions({
        lastName: '',
        photo10x15: 0,
        photo20x30: 0,
        photoInYearbook: false,
        additionalPhotos: false,
        vignette: false,
        photo10x15Name: '',
        photo20x30Name: '',
      });
      console.log('Selection cleared');
    } else if (photo) {
      setSelectedPhoto(photo);
      setInitialIndex(photo.id - 1);
      setShowModal(true);
      setSelectedOptions((prev) => {
        const newOptions = {
          ...prev,
          photo10x15Name: photo.alt.includes('10x15') ? photo.alt : prev.photo10x15Name,
          photo20x30Name: photo.alt.includes('20x30') ? photo.alt : prev.photo20x30Name,
        };
        console.log('Selected options updated:', newOptions);
        return newOptions;
      });
    }
  };

  const handleConfirmSelection = async () => {
    setShowModal(false);
    if (selectedPhoto) {
      const payload = {
        class_id: user.class_name,
        family_name: selectedOptions.lastName,
        photo_id: selectedPhoto.id,
        photo_chronicle: selectedOptions.photoInYearbook ? 1 : 0,
        vignette: selectedOptions.vignette ? 1 : 0,
        photo_10x15: selectedOptions.photo10x15,
        photo_20x30: selectedOptions.photo20x30,
        photo10x15Name: selectedOptions.photo10x15Name,
        photo20x30Name: selectedOptions.photo20x30Name,
      };
      console.log('Payload to be sent to server:', payload);

      const res = await fetch('/api/saveSelection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error('Ошибка при сохранении выбора');
      } else {
        console.log('Selection saved successfully.');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPhoto(null);
  };

  const openLightbox = (index: number) => {
    setInitialIndex(index);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  return (
    <div className={styles.galleryContainer}>
      <h1>Добро пожаловать на страницу галереи</h1>
      <p>Школа: {user.school_name}</p>
      <p>Класс: {user.class_name}</p>
      {photos.length > 0 ? (
        <GalleryGrid
          photos={photos}
          schoolName={user.school_name}
          className={user.class_name}
          selectedPhoto={selectedPhoto}
          selectedOptions={selectedOptions}
          handleSelectPhoto={handleSelectPhoto}
          openLightbox={openLightbox}
          setSelectedOptions={setSelectedOptions}
        />
      ) : (
        <p>Загрузка фотографий...</p>
      )}
      {showLightbox && (
        <LightboxGallery
          photos={photos}
          initialIndex={initialIndex}
          onClose={closeLightbox}
        />
      )}
      {showModal && (
        <PhotoModal
          className={user.class_name}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          handleConfirmSelection={handleConfirmSelection}
          closeModal={closeModal}
          selectedPhoto={selectedPhoto}
        />
      )}
    </div>
  );
};

export default Gallery;
