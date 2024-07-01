import React from 'react';
import styles from '../app/Gallery.module.css';
import { Photo, SelectedOptions } from '../types';

type GalleryGridProps = {
  photos: Photo[];
  // schoolName: string;
  // className: string;
  setSelectedPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  savedPhotos: Photo[];
  selectedOptionsMap: { [key: number]: SelectedOptions };
  handleSelectPhoto: (photo: Photo) => void;
  handleDeleteSelection: (photo: Photo) => void;
  openLightbox: (index: number) => void;
};

const GalleryGrid: React.FC<GalleryGridProps> = ({
  photos,
  savedPhotos,
  selectedOptionsMap,
  handleSelectPhoto,
  handleDeleteSelection,
  openLightbox,
}) => {

  function handleClick(photo: Photo) {
    if (savedPhotos.some(p => p.id === photo.id)) {
      handleDeleteSelection(photo);
    } else {
      handleSelectPhoto(photo);
    }
  }

  function isSelected(photo: Photo): boolean {
    return savedPhotos.some(p => p.id === photo.id);
  }

  console.log("photos", photos, selectedOptionsMap[photos[2].id])
  return (
    <div className={styles.galleryGrid}>
      {photos.map((photo, index) => {
        const selectedOptions = selectedOptionsMap[photo.id] || {
          lastName: '',
          photo10x15: 0,
          photo20x30: 0,
          photoInYearbook: false,
          additionalPhotos: false,
          vignette: false,
          photo10x15Name: '',
          photo20x30Name: '',
          photoInAlbum: false,
        };

        return (
          <div key={photo.id} className={`${styles.galleryItem} ${isSelected(photo) ? styles.selected : ''}`}>
            <a href={photo.src} data-sub-html={photo.alt} onClick={(e) => { e.preventDefault(); openLightbox(index); }}>
              <img src={photo.src} alt={photo.alt} />
            </a>
            <button
              className={styles.button}
              onClick={() => handleClick(photo)}
            >
              {isSelected(photo) ? 'Отменить выбор' : 'Выбрать фото'}
            </button>
            {isSelected(photo) && (
              <div className={styles.selectedOverlay}>
                <div className={styles.selectedTextContainer}>
                  <div className="title">ЗАКАЗАНО: {selectedOptions.lastName}</div>
                  {selectedOptions.photoInYearbook && <div className="detailItem">✔ Фото в летопись</div>}
                  {selectedOptions.vignette && <div className="detailItem">✔ ВИНЬЕТКА</div>}
                  {selectedOptions.photoInAlbum && <div className="detailItem">✔ Фото в альбом</div>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GalleryGrid;
