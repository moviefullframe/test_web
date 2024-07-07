import React from 'react';
import Swal from 'sweetalert2';
import styles from '../app/Gallery.module.css';
import { Photo, SelectedOptions } from '../types';

type GalleryGridProps = {
  photos: Photo[];
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
    if (isSelected(photo)) {
      Swal.fire({
        title: 'Вы уверены?',
        text: "Вы действительно хотите отменить выбор?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Да, отменить выбор',
        cancelButtonText: 'Отмена'
      }).then((result) => {
        if (result.isConfirmed) {
          handleDeleteSelection(photo);
          Swal.fire(
            'Удалено!',
            'Ваш выбор был отменен.',
            'success'
          )
        }
      })
    } else {
      handleSelectPhoto(photo);
    }
  }

  function isSelected(photo: Photo): boolean {
    return !!selectedOptionsMap[photo.id];
  }

  return (
    <div className={styles.galleryGrid}>
      {photos.map((photo, index) => {
        const selectedOptions = selectedOptionsMap[photo.id] || {
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

        return (
          <div key={photo.id || `photo-${index}`} className={`${styles.galleryItem} ${isSelected(photo) ? styles.selected : ''}`}>
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
                  {!!selectedOptions.photo10x15 && <div className="detailItem">✔ Доп фото 10x15 {selectedOptions.photo10x15}шт</div>}
                  {!!selectedOptions.photo15x21 && <div className="detailItem">✔ Доп фото 15x21 {selectedOptions.photo15x21}шт</div>}
                  {!!selectedOptions.photo20x30 && <div className="detailItem">✔ Доп фото 20x30 {selectedOptions.photo20x30}шт</div>}
                  {selectedOptions.allPhotosDigital && <div className="detailItem">✔ Все фото в электронном виде</div>}
                  {selectedOptions.portraitAlbum2 && <div className="detailItem">✔ Портрет в альбом 2</div>}
                  {selectedOptions.portraitAlbum3 && <div className="detailItem">✔ Портрет в альбом 3</div>}
                  {selectedOptions.singlePhotoDigital && <div className="detailItem">✔ 1 фото в электронном виде</div>}
                  {selectedOptions.photoInCube && <div className="detailItem">✔ Фото в кубике</div>}
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
