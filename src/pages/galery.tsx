import { useEffect, useState } from 'react';
import styles from '../app/Gallery.module.css';
import PhotoModal from '../components/PhotoModal';
import LightboxGallery from '../components/LightboxGallery';
import GalleryGrid from '../components/GalleryGrid';
import YandexDiskService from '../services/YandexDiskService';
import { SelectedOptions, Photo, User } from '../types';
import { resetPhotoSelection } from '../pages/api/resetPhotoSelection';

const Gallery = () => {
  const [user, setUser] = useState<User>({ class_name: '', school_name: '' });
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<{ [key: number]: SelectedOptions }>({});

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

  useEffect(() => {
    const fetchUserSelection = async () => {
      if (user.class_name) {
        const res = await fetch(`/api/getUserSelection?user_id=${user.class_name}`);
        if (res.ok) {
          const data = await res.json();
          const { selectedPhotos, selectedOptionsMap } = data;
          setSelectedPhotos(photos.filter(photo => selectedPhotos.includes(photo.id)));
          setSelectedOptionsMap(selectedOptionsMap);
          console.log('User selection fetched:', data);
        } else {
          console.error('Failed to fetch user selection');
        }
      }
    };

    fetchUserSelection();
  }, [user, photos]);

  const handleSelectPhoto = (photo: Photo) => {
    console.log('Photo selected:', photo);
    setSelectedPhoto(photo);
    setSelectedPhotos(prevSelectedPhotos => {
      const alreadySelected = prevSelectedPhotos.some(p => p.id === photo.id);
      if (alreadySelected) {
        return prevSelectedPhotos.filter(p => p.id !== photo.id);
      } else {
        return [...prevSelectedPhotos, photo];
      }
    });
    setShowModal(true);
  };

  const handleConfirmSelection = async () => {
    setShowModal(false);
    if (selectedPhoto) {
      const selectedOptions = selectedOptionsMap[selectedPhoto.id];
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
        album: selectedOptions.photoInAlbum ? 1 : 0,
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

  const handleDeleteSelection = async (photo: Photo) => {
    if (!selectedOptionsMap[photo.id]?.lastName) {
      alert('Пожалуйста, выберите фамилию.');
      return;
    }

    try {
      const res = await fetch('/api/deleteUserSelection', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.class_name,
          photo_id: photo.id,
        }),
      });

      if (res.ok) {
        console.log('Selection deleted successfully');
        setSelectedPhotos(prevSelectedPhotos => prevSelectedPhotos.filter(p => p.id !== photo.id));
        setSelectedOptionsMap(prev => {
          const newMap = { ...prev };
          delete newMap[photo.id];
          return newMap;
        });
      } else {
        console.error('Failed to delete selection');
      }
    } catch (error) {
      console.error('Error deleting selection', error);
    }
  };

  useEffect(() => {
    const saveUserSelection = async () => {
      try {
        const res = await fetch('/api/saveUserSelection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.class_name,
            selectedPhotos,
            selectedOptionsMap,
          }),
        });

        if (res.ok) {
          console.log('User selection saved successfully.');
        } else {
          console.error('Failed to save user selection');
        }
      } catch (error) {
        console.error('Error saving user selection', error);
      }
    };

    if (selectedPhotos.length > 0) {
      saveUserSelection();
    }
  }, [selectedPhotos, selectedOptionsMap, user.class_name]);

  const closeModal = () => {
    console.log('Closing modal');
    setShowModal(false);
  };

  const openLightbox = (index: number) => {
    setInitialIndex(index);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  const handleSelectedOptionsChange = (photoId: number, options: SelectedOptions) => {
    setSelectedOptionsMap(prev => ({
      ...prev,
      [photoId]: options,
    }));
  };

  useEffect(() => {
    console.log('Selected photos:', selectedPhotos);
    console.log('Selected options map:', selectedOptionsMap);
  }, [selectedPhotos, selectedOptionsMap]);

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
          selectedPhotos={selectedPhotos}
          setSelectedPhotos={setSelectedPhotos}
          selectedOptionsMap={selectedOptionsMap}
          handleSelectPhoto={handleSelectPhoto}
          handleDeleteSelection={handleDeleteSelection}
          openLightbox={openLightbox}
          onSelectedOptionsChange={handleSelectedOptionsChange}
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
      {showModal && selectedPhoto && (
        <PhotoModal
          className={user.class_name}
          selectedOptions={selectedOptionsMap[selectedPhoto.id] || {
            lastName: '',
            photo10x15: 0,
            photo20x30: 0,
            photoInYearbook: false,
            additionalPhotos: false,
            vignette: false,
            photo10x15Name: '',
            photo20x30Name: '',
            photoInAlbum: false,
          }}
          onSelectedOptionsChange={(options: SelectedOptions) => handleSelectedOptionsChange(selectedPhoto.id, options)}
          handleConfirmSelection={handleConfirmSelection}
          closeModal={closeModal}
          selectedPhoto={selectedPhoto}
        />
      )}
    </div>
  );
};

export default Gallery;
