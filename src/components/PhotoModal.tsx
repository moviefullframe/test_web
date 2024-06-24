import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../app/Gallery.module.css';

type SelectedOptions = {
  lastName: string;
  photo10x15: number;
  photo20x30: number;
  photoInYearbook: boolean;
  additionalPhotos: boolean;
  vignette: boolean;
};

type Family = {
  id: number;
  family_name: string;
};

type PhotoModalProps = {
  className: string;
  selectedOptions: SelectedOptions;
  setSelectedOptions: React.Dispatch<React.SetStateAction<SelectedOptions>>;
  handleConfirmSelection: () => void;
  closeModal: () => void;
};

const PhotoModal: React.FC<PhotoModalProps> = ({
  className,
  selectedOptions,
  setSelectedOptions,
  handleConfirmSelection,
  closeModal,
}) => {
  const [families, setFamilies] = useState<Family[]>([]);

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const res = await axios.get(`/api/families`, { params: { classId: className } });
        setFamilies(res.data);
      } catch (error) {
        console.error('Failed to fetch families', error);
      }
    };

    fetchFamilies();
  }, [className]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/saveSelection', {
        class_id: className,
        family_name: selectedOptions.lastName,
        photo_chronicle: selectedOptions.photoInYearbook,
        vignette: selectedOptions.vignette,
        photo_10x15: selectedOptions.photo10x15,
        photo_20x30: selectedOptions.photo20x30,
      });

      if (res.status === 200) {
        console.log('Selection saved successfully');
        handleConfirmSelection();
      } else {
        console.error('Failed to save selection');
      }
    } catch (error) {
      console.error('Error saving selection', error);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={closeModal}>×</button>
        <h2>Выберите вашу фамилию</h2>
        <form onSubmit={handleSubmit}>
          <label className={styles.formLabel}>
            Фамилия
            <select
              value={selectedOptions.lastName}
              onChange={(e) =>
                setSelectedOptions((prev) => ({
                  ...prev,
                  lastName: e.target.value,
                }))
              }
            >
              <option value="">Выберите вашу фамилию</option>
              {families.map((family) => (
                <option key={family.id} value={family.family_name}>
                  {family.family_name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={selectedOptions.photoInYearbook}
              onChange={(e) =>
                setSelectedOptions((prev) => ({
                  ...prev,
                  photoInYearbook: e.target.checked,
                }))
              }
            />
            Фото в летопись
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={selectedOptions.vignette}
              onChange={(e) =>
                setSelectedOptions((prev) => ({
                  ...prev,
                  vignette: e.target.checked,
                }))
              }
            />
            Виньетка (общая фотография)
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={selectedOptions.additionalPhotos}
              onChange={(e) =>
                setSelectedOptions((prev) => ({
                  ...prev,
                  additionalPhotos: e.target.checked,
                }))
              }
            />
            Дополнительные фотографии
          </label>
          {selectedOptions.additionalPhotos && (
            <>
              <label className={styles.formLabel}>
                Заказать фото 10x15
                <input
                  type="number"
                  value={selectedOptions.photo10x15}
                  onChange={(e) =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      photo10x15: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className={styles.formLabel}>
                Заказать фото 20x30
                <input
                  type="number"
                  value={selectedOptions.photo20x30}
                  onChange={(e) =>
                    setSelectedOptions((prev) => ({
                      ...prev,
                      photo20x30: Number(e.target.value),
                    }))
                  }
                />
              </label>
            </>
          )}
          <button className={styles.button} type="submit">
            Подтвердите выбор
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhotoModal;
