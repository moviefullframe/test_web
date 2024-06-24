import React, { useEffect } from 'react';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-video.css';
import 'lightgallery/css/lg-zoom.css';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgVideo from 'lightgallery/plugins/video';
import lgZoom from 'lightgallery/plugins/zoom';
import styles from '../app/Gallery.module.css';

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
  };

  return (
    <div className={styles.overlay}>
      <button className={styles.closeButton} onClick={onClose}>×</button>
      <LightGallery
        onInit={handleOnInit}
        speed={500}
        plugins={[lgThumbnail, lgVideo, lgZoom]}
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
