import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm, SubmitHandler } from 'react-hook-form';
import styles from '../app/Gallery.module.css';
import { SelectedOptions, Family, Photo } from '../types';

type PhotoModalProps = {
  className: string;
  selectedOptions: SelectedOptions;
  handleConfirmSelection: (data: SelectedOptions) => void;
  closeModal: () => void;
  selectedPhoto: Photo;
};

const defaultSelectedOptions: SelectedOptions = {
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

const PhotoModal: React.FC<PhotoModalProps> = ({
  className,
  selectedOptions,
  handleConfirmSelection,
  closeModal,
  selectedPhoto
}) => {
  const [families, setFamilies] = useState<Family[]>([]);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SelectedOptions>({
    defaultValues: selectedOptions,
  });

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const res = await axios.get(`/api/families`, { params: { classId: className } });
        console.log('Families fetched from API:', res.data);
        if (res.data && Array.isArray(res.data.families)) {
          setFamilies(res.data.families);
        } else {
          console.error('Unexpected data format:', res.data);
        }
      } catch (error) {
        console.error('Failed to fetch families', error);
      }
    };

    fetchFamilies();
  }, [className]);

  const onSubmit: SubmitHandler<SelectedOptions> = async (data) => {
    handleConfirmSelection(data);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={closeModal}>×</button>
        <h2>Выберите вашу фамилию</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className={styles.formLabel}>
            Фамилия
            <select
              {...register('lastName', { required: true })}
            >
              <option value="">Выберите вашу фамилию</option>
              {families.map((family) => (
                <option key={family.id} value={family.family_name}>
                  {family.family_name}
                </option>
              ))}
            </select>
            {errors.lastName && <span className="error">Фамилия обязательна</span>}
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              {...register('photoInYearbook')}
            />
            Фото в летопись
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              {...register('vignette')}
            />
            Виньетка (общая фотография)
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              {...register('additionalPhotos')}
            />
            Дополнительные фотографии
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              {...register('photoInAlbum')}
            />
            Фото в альбом
          </label>
          {watch('additionalPhotos') && (
            <>
              <label className={styles.formLabel}>
                Заказать фото 10x15
                <input
                  type="number"
                  {...register('photo10x15', { valueAsNumber: true })}
                />
              </label>
              <label className={styles.formLabel}>
                Заказать фото 20x30
                <input
                  type="number"
                  {...register('photo20x30', { valueAsNumber: true })}
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
