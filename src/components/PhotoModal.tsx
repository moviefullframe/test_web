import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm, SubmitHandler } from 'react-hook-form';
import styles from '../app/Gallery.module.css';
import { SelectedOptions, Family, AccountType, Photo } from '../types';

interface PhotoModalProps {
  class_id: number;
  class_name: string;
  selectedOptions: SelectedOptions;
  handleConfirmSelection: (data: SelectedOptions) => void;
  closeModal: () => void;
  selectedPhoto: Photo;
  savedPhotos: Photo[];
}

const PhotoModal: React.FC<PhotoModalProps> = ({
  class_id,
  class_name,
  selectedOptions,
  handleConfirmSelection,
  closeModal,
  selectedPhoto,
  savedPhotos,
}) => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SelectedOptions>({
    defaultValues: selectedOptions,
  });

  const [yearbookPhotoDisabled, setYearbookPhotoDisabled] = useState<boolean>(false);

  useEffect(() => {
    const fetchFamiliesAndAccountType = async () => {
      try {
        const [familiesRes, accountTypeRes] = await Promise.all([
          axios.get(`/api/families`, { params: { class_id } }),
          axios.get(`/api/accountType`, { params: { class_id } })
        ]);
        setFamilies(familiesRes.data.families);
        setAccountType(accountTypeRes.data.accountType);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };

    fetchFamiliesAndAccountType();
  }, [class_name, class_id]);

  useEffect(() => {
    const selectedPhotoInYearbook = savedPhotos.find(photo => photo.selectedOptions?.photoInYearbook && photo.selectedOptions?.lastName === selectedOptions.lastName);
    setYearbookPhotoDisabled(selectedPhotoInYearbook !== undefined && selectedPhotoInYearbook.id !== selectedPhoto.id);
  }, [savedPhotos, selectedOptions.lastName, selectedPhoto.id]);

  const onSubmit: SubmitHandler<SelectedOptions> = async (data) => {
    handleConfirmSelection(data);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, name: keyof SelectedOptions) => {
    const value = e.target.value.replace(/^0+(?!$)/, '');
    setValue(name, value === '' ? 0 : parseInt(value, 10));
  };

  const commonBlocks = <>
    <label className={styles.formLabel}>
      Заказать фото 10x15
      <input
        type="number"
        {...register('photo10x15', { valueAsNumber: true })}
        onChange={(e) => handleNumberChange(e, 'photo10x15')}
      />
    </label>
    <label className={styles.formLabel}>
      Заказать фото 15x21
      <input
        type="number"
        {...register('photo15x21', { valueAsNumber: true })}
        onChange={(e) => handleNumberChange(e, 'photo15x21')}
      />
    </label>
    <label className={styles.formLabel}>
      Заказать фото 20x30
      <input
        type="number"
        {...register('photo20x30', { valueAsNumber: true })}
        onChange={(e) => handleNumberChange(e, 'photo20x30')}
      />
    </label>
  </>

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={closeModal}>×</button>
        <h2>Выберите вашу фамилию</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className={styles.formLabel}>
            Фамилия
            <select {...register('lastName', { required: true })}>
              <option value="">Выберите вашу фамилию</option>
              {families.map((family) => (
                <option key={family.id} value={family.family_name}>{family.family_name}</option>
              ))}
            </select>
            {errors.lastName && <span className="error">Фамилия обязательна</span>}
          </label>
          {accountType && accountType.type_name === 'летопись' && (
            <>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  {...register('photoInYearbook')}
                  disabled={yearbookPhotoDisabled}
                /> Фото в летопись
              </label>
              {commonBlocks}
            </>
          )}
          {accountType && accountType.type_name === 'альбом 1 портрет' && (
            <>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('photoInAlbum')} /> Портрет в альбом
              </label>
              <label className={styles.formLabel}>
                Все фото в электронном виде
                <input type="checkbox" {...register('allPhotosDigital')} />
              </label>
              <label className={styles.formLabel}>
                1 фото в электронном виде
                <input type="checkbox" {...register('singlePhotoDigital')} />
              </label>
              {commonBlocks}
            </>
          )}
          {accountType && accountType.type_name === 'альбом 2 портрета' && (
            <>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('photoInAlbum')} /> Портрет в альбом
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('portraitAlbum2')} /> Портрет в альбом 2
              </label>
              <label className={styles.formLabel}>
                Все фото в электронном виде
                <input type="checkbox" {...register('allPhotosDigital')} />
              </label>
              <label className={styles.formLabel}>
                1 фото в электронном виде
                <input type="checkbox" {...register('singlePhotoDigital')} />
              </label>
              {commonBlocks}
            </>
          )}
          {accountType && accountType.type_name === 'альбом 3 портрета' && (
            <>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('photoInAlbum')} /> Портрет в альбом
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('portraitAlbum2')} /> Портрет в альбом 2
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('portraitAlbum3')} /> Портрет в альбом 3
              </label>
              <label className={styles.formLabel}>
                Все фото в электронном виде
                <input type="checkbox" {...register('allPhotosDigital')} />
              </label>
              <label className={styles.formLabel}>
                1 фото в электронном виде
                <input type="checkbox" {...register('singlePhotoDigital')} />
              </label>
              {commonBlocks}
            </>
          )}
          {accountType && accountType.type_name === 'альбом кубики' && (
            <>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('photoInCube')} /> Фото в кубике
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('photoInAlbum')} /> Портрет в альбом
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('portraitAlbum2')} /> Портрет в альбом 2
              </label>
              <label className={styles.formLabel}>
                <input type="checkbox" {...register('allPhotosDigital')} /> Все фото в электронном виде
              </label>
              <label className={styles.formLabel}>
                <input type="checkbox" {...register('singlePhotoDigital')} /> 1 фото в электронном виде
              </label>
              {commonBlocks}
            </>
          )}
          {accountType && accountType.type_name === 'альбом выбор групп' && (
            <>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('photoInAlbum')} /> Фото в альбом
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('portraitAlbum2')} /> Портрет в альбом 2
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" {...register('portraitAlbum3')} /> Портрет в альбом 3
              </label>
              <label className={styles.formLabel}>
                Все фото в электронном виде
                <input type="checkbox" {...register('allPhotosDigital')} />
              </label>
              <label className={styles.formLabel}>
                1 фото в электронном виде
                <input type="checkbox" {...register('singlePhotoDigital')} />
              </label>
              {commonBlocks}
            </>
          )}
          <div className={styles.buttonContainer}>
            <button className={`${styles.button} ${yearbookPhotoDisabled ? styles.disabledButton : ''}`} type="submit" disabled={yearbookPhotoDisabled}>Подтвердите выбор</button>
            <button className={styles.cancelButton} type="button" onClick={closeModal}>Отменить выбор</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhotoModal;
