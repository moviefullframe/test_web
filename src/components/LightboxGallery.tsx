import React, { useEffect, useRef } from 'react';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-video.css';
import 'lightgallery/css/lg-zoom.css';
import lgVideo from 'lightgallery/plugins/video';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
import lgHash from 'lightgallery/plugins/hash';
import styles from './PhotoViewer.module.css';
import { Photo } from '../types';

type LightboxGalleryProps = {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
};

const LightboxGallery: React.FC<LightboxGalleryProps> = ({ photos, initialIndex, onClose }) => {
  const lightGallery = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleHashChange = () => {
      if (!window.location.hash.includes('lg=')) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [onClose]);

  const handleOnInit = (detail: any) => {
    lightGallery.current = detail.instance;
    detail.instance.openGallery(initialIndex);
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
        download={false}
        speed={500}
        plugins={[lgVideo, lgZoom, lgFullscreen, lgHash]}
        dynamic
        dynamicEl={photos.map((photo) => ({
          src: photo.src,
          thumb: photo.src,
          subHtml: `<div>${photo.alt}</div>`,
        }))}
        onAfterClose={onClose}
      />
    </div>
  );
};

export default LightboxGallery;
