import React from 'react';
import styles from '../app/Gallery.module.css';
import { Photo, SelectedOptions } from '../types';

type GalleryGridProps = {
  photos: Photo[];
  schoolName: string;
  className: string;
  selectedPhotos: Photo[];
  setSelectedPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  selectedOptionsMap: { [key: number]: SelectedOptions };
  handleSelectPhoto: (photo: Photo) => void;
  handleDeleteSelection: (photo: Photo) => void;
  openLightbox: (index: number) => void;
  onSelectedOptionsChange: (photoId: number, options: SelectedOptions) => void;
};

const GalleryGrid: React.FC<GalleryGridProps> = ({
  photos,
  schoolName,
  className,
  selectedPhotos,
  setSelectedPhotos,
  selectedOptionsMap,
  handleSelectPhoto,
  handleDeleteSelection,
  openLightbox,
  onSelectedOptionsChange,
}) => {
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
          <div key={photo.id} className={`${styles.galleryItem} ${selectedPhotos.some(p => p.id === photo.id) ? styles.selected : ''}`}>
            <a href={photo.src} data-sub-html={photo.alt} onClick={(e) => { e.preventDefault(); openLightbox(index); }}>
              <img src={photo.src} alt={photo.alt} />
            </a>
            <button
              className={styles.button}
              onClick={() => {
                if (selectedPhotos.some(p => p.id === photo.id)) {
                  handleDeleteSelection(photo);
                } else {
                  handleSelectPhoto(photo);
                }
              }}
            >
              {selectedPhotos.some(p => p.id === photo.id) ? 'Отменить выбор' : 'Выбрать фото'}
            </button>
            {selectedPhotos.some(p => p.id === photo.id) && (
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
