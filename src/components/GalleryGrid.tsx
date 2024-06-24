import React, { useEffect, useState } from 'react';
import axios from 'axios';
import YandexDiskService from '../services/YandexDiskService';
import styles from '../app/Gallery.module.css';

type Photo = {
  id: number;
  src: string;
  alt: string;
};

type SelectedOptions = {
  lastName: string;
  photo10x15: number;
  photo20x30: number;
  photoInYearbook: boolean;
  additionalPhotos: boolean;
  vignette: boolean;
};

type GalleryGridProps = {
  photos: Photo[];
  schoolName: string;
  className: string;
  selectedPhoto: Photo | null;
  selectedOptions: SelectedOptions;
  handleSelectPhoto: (photo: Photo | null) => void; // Изменено здесь
  openLightbox: (index: number) => void;
  setSelectedOptions: React.Dispatch<React.SetStateAction<SelectedOptions>>;
};

const GalleryGrid: React.FC<GalleryGridProps> = ({
  photos,
  schoolName,
  className,
  selectedPhoto,
  selectedOptions,
  handleSelectPhoto,
  openLightbox,
  setSelectedOptions,
}) => {
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const folderPath = `schools/${schoolName}/${className}`;
      const items = await YandexDiskService.getFolderContents(folderPath);
      const fetchedPhotos = items
        .filter((item: any) => item.type === 'file')
        .map((item: any, index: number) => ({
          id: index + 1,
          src: item.file,
          alt: item.name,
        }));
      setGalleryPhotos(fetchedPhotos);
    };

    fetchPhotos();
  }, [schoolName, className]);

  const handleDeleteSelection = async () => {
    try {
      const res = await axios.delete('/api/deleteSelection', {
        data: {
          class_id: className,
          family_name: selectedOptions.lastName,
        },
      });

      if (res.status === 200) {
        console.log('Selection deleted successfully');
        setSelectedOptions({
          lastName: '',
          photo10x15: 0,
          photo20x30: 0,
          photoInYearbook: false,
          additionalPhotos: false,
          vignette: false,
        });
        handleSelectPhoto(null); // Здесь передаем null
      } else {
        console.error('Failed to delete selection');
      }
    } catch (error) {
      console.error('Error deleting selection', error);
    }
  };

  return (
    <div className={styles.galleryGrid}>
      {galleryPhotos.map((photo, index) => (
        <div key={photo.id} className={`${styles.galleryItem} ${selectedPhoto?.id === photo.id ? styles.selected : ''}`}>
          <a href={photo.src} data-sub-html={photo.alt} onClick={(e) => { e.preventDefault(); openLightbox(index); }}>
            <img src={photo.src} alt={photo.alt} />
          </a>
          <button
            className={styles.button}
            onClick={() => selectedPhoto?.id === photo.id ? handleDeleteSelection() : handleSelectPhoto(photo)}
          >
            {selectedPhoto?.id === photo.id ? 'Отменить выбор' : 'Выбрать фото'}
          </button>
          {selectedPhoto?.id === photo.id && (
            <div className={styles.selectedOverlay}>
              <div className={styles.selectedTextContainer}>
                <div className="title">ЗАКАЗАНО: {selectedOptions.lastName}</div>
                {selectedOptions.photoInYearbook && <div className="detailItem">✔ Фото в летопись</div>}
                {selectedOptions.vignette && <div className="detailItem">✔ ВИНЬЕТКА</div>}
                {selectedOptions.additionalPhotos && (
                  <>
                    <div className="detailItem">Фото 10x15: {selectedOptions.photo10x15}</div>
                    <div className="detailItem">Фото 20x30: {selectedOptions.photo20x30}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;
