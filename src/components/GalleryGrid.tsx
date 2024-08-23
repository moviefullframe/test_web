import React, { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import 'lazysizes';
import 'lazysizes/plugins/parent-fit/ls.parent-fit';
import styles from '../app/Gallery.module.css';
import { Photo, SelectedOptions } from '../types';
import usePhotoStore from '../store/photoStore';
import { shallow } from 'zustand/shallow';


declare global {
  interface Window {
    lazySizesConfig: {
      expand?: number;
      expFactor?: number;
      loadMode?: number;
      lazyClass?: string;
      loadingClass?: string;
      loadedClass?: string;
      preloadClass?: string;
      errorClass?: string;
      autosizesClass?: string;
      srcAttr?: string;
      srcsetAttr?: string;
      sizesAttr?: string;
      [key: string]: any;
    };
  }
}

type GalleryGridProps = {
  photos: Photo[];
  savedPhotos: Photo[];
  selectedOptionsMap: { [key: number]: SelectedOptions };
  handleSelectPhoto: (photo: Photo) => void;
  handleDeleteSelection: (photo: Photo) => void;
  openLightbox: (index: number) => void;
};

const accountTypeId = 1; // Предположим, это значение передается в ваш компонент

const GalleryGrid: React.FC<GalleryGridProps> = ({ openLightbox }) => {
  const { 
    photos, 
    selectedOptionsMap, 
    setSelectedPhoto,
    deleteSelectedOptions,
  } = usePhotoStore(
    state => ({
      photos: state.photos,
      selectedOptionsMap: state.selectedOptionsMap,
      setSelectedPhoto: state.setSelectedPhoto,
      deleteSelectedOptions: state.deleteSelectedOptions,
    }),
    shallow
  );

  const observer = useRef<IntersectionObserver>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.lazySizesConfig = window.lazySizesConfig || {};
      window.lazySizesConfig.expand = 300;
      window.lazySizesConfig.expFactor = 1.2;
      window.lazySizesConfig.loadMode = 2;
      window.lazySizesConfig.lazyClass = 'lazyload';
      window.lazySizesConfig.loadingClass = 'loading';
      window.lazySizesConfig.loadedClass = 'loaded';
      window.lazySizesConfig.errorClass = 'error';
      window.lazySizesConfig.srcAttr = 'data-src';
      window.lazySizesConfig.srcsetAttr = 'data-srcset';
      window.lazySizesConfig.sizesAttr = 'data-sizes';
    }

    const obsOptions = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    const preloadImage = (img: HTMLImageElement) => {
      const src = img.getAttribute('data-src');
      if (!src) {
        return;
      }
      img.src = src;
    };

    observer.current = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          preloadImage(entry.target as HTMLImageElement);
          obs.unobserve(entry.target);
        }
      });
    }, obsOptions);

    const images = document.querySelectorAll('.lazyload');
    images.forEach(image => {
      observer.current?.observe(image);
    });

    setLoading(false);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  function handleClick(photo: Photo) {
    console.log('Click on photo:', photo);

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
        if (result.isConfirmed && photo.photo_id !== undefined) {
          console.log('Attempting to delete selection for photo ID:', photo.photo_id);
          deleteSelectedOptions(photo.photo_id);
          Swal.fire(
            'Удалено!',
            'Ваш выбор был отменен.',
            'success'
          )
        }
      })
    } else {
      console.log('Selecting photo:', photo);
      setSelectedPhoto(photo);
    }
  }

  function isSelected(photo: Photo): boolean {
    const actualPhotoId = Number(photo.photo_id);

    if (actualPhotoId === undefined || actualPhotoId === null) {
      console.warn(`photo_id is missing for photo with id: ${photo.id}`);
      return false;
    }

    const isSelected = !!selectedOptionsMap[actualPhotoId];
    console.log(`isSelected(${actualPhotoId}):`, isSelected);
    return isSelected;
  }

  return (
    <div className={styles.galleryGrid}>
      {loading ? (
        <p>Loading...</p>
      ) : (
        photos.map((photo, index) => {
          const selectedOptions = selectedOptionsMap[photo.photo_id !== undefined ? photo.photo_id : 0] || {
            lastName: '',
            photo10x15: null,
            photo15x21: null,
            photo20x30: null,
            photoInYearbook: false,
            vignette: false,
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
                <img
                  data-src={photo.src}
                  data-srcset={`${photo.src} 600w, ${photo.src} 1200w`}
                  sizes="(max-width: 600px) 480px, 800px"
                  alt={photo.alt}
                  className="lazyload"
                />
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
                    {accountTypeId !== 1 && (
                      <>
                        {selectedOptions.album_selection === 1 ? 
                          <div className="detailItem">✔ Беру альбом</div> : 
                          <div className="detailItem">✖ Не беру альбом</div>
                        }
                      </>
                    )}
                    {selectedOptions.photoInAlbum && <div className="detailItem">✔ Фото в альбом</div>}
                    {selectedOptions.photo10x15 > 0 && <div className="detailItem">✔ Доп фото 10x15 {selectedOptions.photo10x15}шт</div>}
                    {selectedOptions.photo15x21 > 0 && <div className="detailItem">✔ Доп фото 15x21 {selectedOptions.photo15x21}шт</div>}
                    {selectedOptions.photo20x30 > 0 && <div className="detailItem">✔ Доп фото 20x30 {selectedOptions.photo20x30}шт</div>}
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
        })
      )}
    </div>
  );
};

export default GalleryGrid;
