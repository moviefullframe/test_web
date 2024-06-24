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
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (user.school_name && user.class_name) {
        const folderPath = `schools/${user.school_name}/${user.class_name}`;
        const items = await YandexDiskService.getFolderContents(folderPath);
        const fetchedPhotos = items
          .filter((item: any) => item.type === 'file')
          .map((item: any, index: number) => ({
            id: index + 1,
            src: item.file,
            alt: item.name,
          }));
        setPhotos(fetchedPhotos);
      }
    };

    fetchPhotos();
  }, [user]);

  const handleSelectPhoto = (photo: Photo | null) => {
    if (selectedPhoto?.id === photo?.id) {
      setSelectedPhoto(null);
      setSelectedOptions({
        lastName: '',
        photo10x15: 0,
        photo20x30: 0,
        photoInYearbook: false,
        additionalPhotos: false,
        vignette: false,
      });
    } else if (photo) {
      setSelectedPhoto(photo);
      setInitialIndex(photo.id - 1);
      setShowModal(true);
    }
  };

  const handleConfirmSelection = async () => {
    setShowModal(false);
    if (selectedPhoto) {
      const res = await fetch('/api/saveSelection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: user.class_name,
          family_name: selectedOptions.lastName,
          photo_id: selectedPhoto.id,
          photo_chronicle: selectedOptions.photoInYearbook ? 1 : 0,
          vignette: selectedOptions.vignette ? 1 : 0,
          photo_10x15: selectedOptions.photo10x15,
          photo_20x30: selectedOptions.photo20x30,
          file_name: selectedPhoto.src,
        }),
      });

      if (!res.ok) {
        console.error('Ошибка при сохранении выбора');
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
          setSelectedOptions={setSelectedOptions} // Добавлено
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
        />
      )}
    </div>
  );
};

export default Gallery;
