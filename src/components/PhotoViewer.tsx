import React, { useEffect } from 'react';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-video.css';
import 'lightgallery/css/lg-zoom.css';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgVideo from 'lightgallery/plugins/video';
import lgZoom from 'lightgallery/plugins/zoom';
import styles from './PhotoViewer.module.css';

type PhotoViewerProps = {
  photos: { src: string; alt: string }[];
  initialIndex: number;
  onClose: () => void;
};

const PhotoViewer: React.FC<PhotoViewerProps> = ({ photos, initialIndex, onClose }) => {
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
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <LightGallery
          onInit={handleOnInit}
          speed={500}
          controls={true}
          download={false}  // Добавляем эту строку для отключения кнопки загрузки
          plugins={[lgThumbnail, lgVideo, lgZoom]}
          dynamic
          dynamicEl={photos.map(photo => ({
            src: photo.src,
            thumb: photo.src,
            subHtml: `<h4>${photo.alt}</h4>`,
          }))}
          index={initialIndex}
          onAfterClose={onClose}
          mode="lg-fade" // Add your preferred mode
        />
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default PhotoViewer;
