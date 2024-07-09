import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../app/Gallery.module.css';
import PhotoModal from '../components/PhotoModal';
import LightboxGallery from '../components/LightboxGallery';
import GalleryGrid from '../components/GalleryGrid';
import { SelectedOptions, Photo, User } from '../types';

const defaultOptions = {
  lastName: '',
  photo10x15: 0,
  photo15x21: 0,
  photo20x30: 0,
  photoInYearbook: false,
  additionalPhotos: false,
  vignette: false,
  photo10x15Name: '',
  photo15x21Name: '',
  photo20x30Name: '',
  photoInAlbum: false,
  allPhotosDigital: false,
  portraitAlbum2: false,
  portraitAlbum3: false,
  singlePhotoDigital: false,
  photoInCube: false,
};

const Gallery = () => {
  const [user, setUser] = useState<User>({ class_name: '', school_name: '', class_id: 0 });
  const [savedPhotos, setSavedPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<{ [key: number]: SelectedOptions }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log('User loaded from localStorage:', parsedUser);

      const fetchClassId = async () => {
        try {
          const res = await axios.get(`/api/getClassId?class_name=${parsedUser.class_name}`);
          if (res.status === 200) {
            const classId = res.data.class_id;
            setUser(prev => ({ ...prev, class_id: classId }));
            console.log('Fetched class_id:', classId);
          } else {
            console.error('Failed to fetch class_id');
          }
        } catch (error: any) {
          console.error('Error fetching class_id:', error);
        }
      };

      fetchClassId();
    }
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (user.school_name && user.class_name) {
        const folderPath = `schools/${user.school_name}/${user.class_name}`;
        console.log('Fetching photos from Yandex Object Storage with folderPath:', folderPath);
        try {
          const response = await axios.get(`/api/getFolderContents`, {
            params: {
              bucketName: 'testphoto2',
              folderPath,
              classId: user.class_id,
            },
          });

          const items = response.data;
          console.log('Yandex Object Storage items fetched:', items);

          const fetchedPhotos = items.map((item: any) => ({
            id: item.photo_id,
            src: item.src,
            alt: item.alt,
            photoSize: item.photoSize,
            photoType: item.photoType,
          }));

          setPhotos(fetchedPhotos);
          console.log('Photos fetched from Yandex Object Storage:', fetchedPhotos);
        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            console.error('No contents found in the specified bucket and folder path.');
          } else {
            console.error('Error fetching photos from Yandex Object Storage:', error);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPhotos();
  }, [user.school_name, user.class_name, user.class_id]);

  useEffect(() => {
    const fetchSavedPhotos = async () => {
      if (user.class_id) {
        try {
          const res = await axios.get(`/api/family_photos?class_id=${user.class_id}`);
          if (res.status === 200) {
            const data = res.data;
            console.log('Data fetched from database:', data);

            const savedPhotos = data;
            const selectedOptionsMap = data.reduce((acc: any, item: any) => {
              acc[item.photo_id] = {
                lastName: item.family_name,
                photo10x15: item.photo_size === '10x15' ? item.photo_count : 0,
                photo15x21: item.photo_size === '15x21' ? item.photo_count : 0,
                photo20x30: item.photo_size === '20x30' ? item.photo_count : 0,
                photoInYearbook: item.photo_chronicle,
                vignette: item.vignette,
                photo10x15Name: item.photo_size === '10x15' ? item.file_name : '',
                photo15x21Name: item.photo_size === '15x21' ? item.file_name : '',
                photo20x30Name: item.photo_size === '20x30' ? item.file_name : '',
                photoInAlbum: item.album,
                allPhotosDigital: item.all_photos_digital,
                portrait_album_2: item.portrait_album_2,
                portrait_album_3: item.portrait_album_3,
                single_photo_digital: item.single_photo_digital,
                photoInCube: item.photo_in_cube,
              };
              return acc;
            }, {});
            setSavedPhotos(savedPhotos);
            setSelectedOptionsMap(selectedOptionsMap);
            console.log('Saved photos:', savedPhotos);
            console.log('Selected options map:', selectedOptionsMap);

            localStorage.setItem('savedPhotos', JSON.stringify(savedPhotos));
            localStorage.setItem('selectedOptionsMap', JSON.stringify(selectedOptionsMap));
          } else {
            console.error('Failed to fetch saved photos');
          }
        } catch (error) {
          console.error('Error fetching saved photos:', error);
        }
      }
    };

    fetchSavedPhotos();
  }, [user.class_id]);

  const handleSelectPhoto = (photo: Photo) => {
    console.log('Photo selected:', photo);
    setSelectedPhoto(photo);
  };

  const handleConfirmSelection = async (options: SelectedOptions) => {
    if (!selectedPhoto) {
      return;
    }
    try {
      const payload = {
        class_id: user.class_id,
        family_name: options.lastName,
        photo_id: selectedPhoto.id,
        photo_size: options.photo10x15 > 0 ? '10x15' : options.photo15x21 > 0 ? '15x21' : '20x30',
        photo_count: options.photo10x15 > 0 ? options.photo10x15 : options.photo15x21 > 0 ? options.photo15x21 : options.photo20x30,
        photo_chronicle: options.photoInYearbook ? 1 : 0,
        vignette: options.vignette ? 1 : 0,
        album: options.photoInAlbum ? 1 : 0,
        all_photos_digital: options.allPhotosDigital ? 1 : 0,
        portrait_album_2: options.portraitAlbum2 ? 1 : 0,
        portrait_album_3: options.portraitAlbum3 ? 1 : 0,
        single_photo_digital: options.singlePhotoDigital ? 1 : 0,
        photo_in_cube: options.photoInCube ? 1 : 0,
        file_name_id: selectedPhoto.id
      };

      console.log('Payload to be sent to server:', payload);

      const res = await axios.post('/api/saveSelection', payload);

      if (res.status !== 200) {
        console.error('Ошибка при сохранении выбора');
      }

      setSelectedOptionsMap(prev => ({
        ...prev,
        [selectedPhoto.id]: options,
      }));
      setSavedPhotos(prev => [...prev, { ...selectedPhoto, selectedOptions: options }]);
      console.log('Выбор успешно сохранен');
    } catch (error) {
      console.error('Ошибка при сохранении выбора', error);
    }
    setSelectedPhoto(null);
  };

  const handleDeleteSelection = async (photo: Photo) => {
    const options = selectedOptionsMap[photo.id];
    if (!options || !options.lastName) {
      alert('Пожалуйста, выберите фамилию.');
      return;
    }

    try {
      const res = await axios.delete('/api/deleteSelection', {
        data: {
          class_id: user.class_id,
          family_name: options.lastName,
          photo_id: photo.id,
        },
      });

      if (res.status === 200) {
        console.log('Selection deleted successfully');
        setSelectedOptionsMap(prev => {
          const newMap = { ...prev };
          delete newMap[photo.id];
          return newMap;
        });
        setSavedPhotos(prev => prev.filter(p => p.id !== photo.id));
      } else {
        console.error('Failed to delete selection');
      }
    } catch (error) {
      console.error('Error deleting selection:', error);
    }
  };

  const closeModal = () => {
    console.log('Closing modal');
    setSelectedPhoto(null);
  };

  const openLightbox = (index: number) => {
    setInitialIndex(index);
    setShowLightbox(false);  // Reset state
    setTimeout(() => setShowLightbox(true), 0);  // Open lightbox after state reset
    window.location.hash = `lg=${index}`;
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
  };

  const handleSelectedOptionsChange = (photoId: number, options: SelectedOptions) => {
    setSelectedOptionsMap(prev => ({
      ...prev,
      [photoId]: options,
    }));
  };

  useEffect(() => {
    console.log('Selected photos:', savedPhotos);
    console.log('Selected options map:', selectedOptionsMap);
    console.log('LocalStorage savedPhotos:', localStorage.getItem('savedPhotos'));
    console.log('LocalStorage selectedOptionsMap:', localStorage.getItem('selectedOptionsMap'));
  }, [savedPhotos, selectedOptionsMap]);

  return (
    <div className={styles.galleryContainer}>
      <h1>Добро пожаловать на страницу галереи</h1>
      <p>Школа: {user.school_name}</p>
      <p>Класс: {user.class_name}</p>
      {loading ? (
        <p>Загрузка фотографий...</p>
      ) : (
        photos.length > 0 ? (
          <GalleryGrid
            photos={photos}
            savedPhotos={savedPhotos}
            setSelectedPhotos={setSavedPhotos}
            selectedOptionsMap={selectedOptionsMap}
            handleSelectPhoto={handleSelectPhoto}
            handleDeleteSelection={handleDeleteSelection}
            openLightbox={openLightbox}
          />
        ) : (
          <p>Фотографии отсутствуют.</p>
        )
      )}
      {showLightbox && (
        <LightboxGallery
          photos={photos}
          initialIndex={initialIndex}
          onClose={closeLightbox}
        />
      )}
      {selectedPhoto && (
        <PhotoModal
          class_id={user.class_id}
          class_name={user.class_name}
          selectedOptions={selectedOptionsMap[selectedPhoto.id] || defaultOptions}
          handleConfirmSelection={handleConfirmSelection}
          closeModal={closeModal}
          selectedPhoto={selectedPhoto}
          savedPhotos={savedPhotos} // Передаем сохраненные фото
        />
      )}
    </div>
  );
};

export default Gallery;
