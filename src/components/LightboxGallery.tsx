import React, { useEffect } from 'react';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-video.css';
import 'lightgallery/css/lg-zoom.css';
import lgVideo from 'lightgallery/plugins/video';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen'; // Импортируйте плагин
import styles from './PhotoViewer.module.css'; // Импортируйте правильный CSS файл

type Photo = {
  id: number;
  src: string;
  alt: string;
};

type LightboxGalleryProps = {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
};

const LightboxGallery: React.FC<LightboxGalleryProps> = ({ photos, initialIndex, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleOnInit = (detail: any) => {
    detail.instance.openGallery(initialIndex);
    // Удаляем кнопку скачивания после инициализации галереи
    setTimeout(() => {
      const downloadButton = document.querySelector('.lg-download');
      if (downloadButton) {
        downloadButton.remove();
      }
    }, 100);
  };

  return (
    <div className={styles.overlay}>
      <button className={styles.closeButton} onClick={onClose}>×</button>
      <LightGallery
        onInit={handleOnInit}
        speed={500}
        plugins={[lgVideo, lgZoom, lgFullscreen]} // Убедитесь, что используемые плагины корректны
        dynamic
        dynamicEl={photos.map((photo) => ({
          src: photo.src,
          thumb: photo.src,
          subHtml: photo.alt,
        }))}
        onAfterClose={onClose}
      />
    </div>
  );
};

export default LightboxGallery;
