import React, { useEffect } from 'react';
import axios from 'axios';
import styles from '../app/Gallery.module.css';
import PhotoModal from '../components/PhotoModal';
import LightboxGallery from '../components/LightboxGallery';
import GalleryGrid from '../components/GalleryGrid';
import FilterByLastName from '../components/FilterByLastName';
import usePhotoStore from '../store/photoStore';

const Gallery: React.FC = () => {
  const {
    user,
    photos,
    savedPhotos,
    selectedPhoto,
    showLightbox,
    initialIndex,
    loading,
    selectedLastName,
    selectedOptionsMap,
    setUser,
    setPhotos,
    setSavedPhotos,
    setSelectedOptionsMap,
    setSelectedPhoto,
    setShowLightbox,
    setInitialIndex,
    setLoading,
    setSelectedLastName,
    fetchPhotos,
    handleSelectPhoto,
    handleDeleteSelection,
    handleConfirmSelection,
    handleLastNameChange,
    handlePhotosChange,
  } = usePhotoStore();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedSavedPhotos = localStorage.getItem('savedPhotos');
    const storedSelectedOptionsMap = localStorage.getItem('selectedOptionsMap');

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      const fetchClassId = async () => {
        try {
          console.log('Fetching class ID for user:', parsedUser.class_name);
          const res = await axios.get(`/api/getClassId?class_name=${parsedUser.class_name}`);
          if (res.status === 200) {
            const classId = res.data.class_id;
            setUser({ ...parsedUser, class_id: classId });
            console.log('Fetched class ID:', classId);
            await fetchPhotos(parsedUser.school_name, parsedUser.class_name, classId);
            localStorage.setItem('user', JSON.stringify({ ...parsedUser, class_id: classId }));
          }
        } catch (error) {
          console.error('Error fetching class_id:', error);
        }
      };

      fetchClassId();
    }

    if (storedSavedPhotos) {
      setSavedPhotos(JSON.parse(storedSavedPhotos));
    }

    if (storedSelectedOptionsMap) {
      setSelectedOptionsMap(JSON.parse(storedSelectedOptionsMap));
    }
  }, []);

  useEffect(() => {
    const fetchSavedPhotos = async () => {
      if (user.class_id) {
        try {
          console.log('Fetching saved photos for class ID:', user.class_id);
          const res = await axios.get(`/api/family_photos?class_id=${user.class_id}`);
          if (res.status === 200) {
            const data = res.data;
            setSavedPhotos(data);
            console.log('Fetched saved photos:', data);
            const selectedOptionsMap = data.reduce((acc: any, item: any) => {
              acc[item.photo_id] = {
                lastName: item.family_name || '',
                photo10x15: item.photo_10x15 || 0,
                photo15x21: item.photo_15x21 || 0,
                photo20x30: item.photo_20x30 || 0,
                photoInYearbook: !!item.photo_chronicle,
                vignette: !!item.vignette,
                photo10x15Name: item.photo_size === '10x15' ? item.file_name || '' : '',
                photo15x21Name: item.photo_size === '15x21' ? item.file_name || '' : '',
                photo20x30Name: item.photo_size === '20x30' ? item.file_name || '' : '',
                photoInAlbum: !!item.album,
                allPhotosDigital: !!item.all_photos_digital,
                portraitAlbum2: !!item.portrait_album_2,
                portraitAlbum3: !!item.portrait_album_3,
                singlePhotoDigital: !!item.single_photo_digital,
                photoInCube: !!item.photo_in_cube,
                album_selection: item.album_selection ? 1 : 0,
              };
              return acc;
            }, {});
            setSelectedOptionsMap(selectedOptionsMap);
            console.log('Updated selectedOptionsMap:', selectedOptionsMap);
            localStorage.setItem('savedPhotos', JSON.stringify(data));
            localStorage.setItem('selectedOptionsMap', JSON.stringify(selectedOptionsMap));
          }
        } catch (error) {
          console.error('Error fetching saved photos:', error);
        }
      }
    };

    fetchSavedPhotos();
  }, [user.class_id]);

  const openLightbox = (index: number) => {
    setInitialIndex(index);
    setShowLightbox(false);
    setTimeout(() => setShowLightbox(true), 0);
    window.location.hash = `lg=${index}`;
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
  };

  return (
    <div className={styles.galleryContainer}>
      <h1>Добро пожаловать на страницу галереи</h1>
      <p>Школа: {user.school_name}</p>
      <p>Класс: {user.class_name}</p>
      {user.school_name && user.class_name && (
        <FilterByLastName
          classId={user.class_id}
          schoolName={user.school_name}
          className={user.class_name}
          selectedLastName={selectedLastName}
          onLastNameChange={handleLastNameChange}
          onPhotosChange={handlePhotosChange}
        />
      )}

      {loading ? (
        <p>Загрузка фотографий...</p>
      ) : (
        photos.length > 0 ? (
          <GalleryGrid
            photos={photos}
            savedPhotos={savedPhotos}
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
          selectedOptions={selectedOptionsMap[selectedPhoto.id] || {}}
          handleConfirmSelection={handleConfirmSelection}
          closeModal={() => setSelectedPhoto(null)}
          selectedPhoto={selectedPhoto}
          savedPhotos={savedPhotos}
        />
      )}
    </div>
  );
};

export default Gallery;
