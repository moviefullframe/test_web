import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm, SubmitHandler } from 'react-hook-form';
import Swal from 'sweetalert2';
import styles from '../app/Gallery.module.css';
import { SelectedOptions, Family, AccountType, Photo } from '../types';
import usePhotoStore from '../store/photoStore'; // Импорт Zustans store

interface PhotoModalProps {
  class_id: number;
  class_name: string;
  selectedOptions: SelectedOptions;
  handleConfirmSelection: (data: any) => void;
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
  const { register, handleSubmit, setValue, formState: { errors, isValid } } = useForm<SelectedOptions>({
    defaultValues: selectedOptions,
    mode: 'onChange',
  });

  const setSelectedOptionsMap = usePhotoStore(state => state.setSelectedOptionsMap);

  const [disabledCheckboxes, setDisabledCheckboxes] = useState({
    photoInAlbum: false,
    portraitAlbum2: false,
    portraitAlbum3: false,
    photoInCube: false,
    allPhotosDigital: false,
    singlePhotoDigital: false
  });

  const [showPortraitAlbum2And3, setShowPortraitAlbum2And3] = useState(true);

  useEffect(() => {
    if (selectedOptions.album_selection === 0) {
      setShowPortraitAlbum2And3(false);
      setValue('portraitAlbum2', false);
      setValue('portraitAlbum3', false);
    } else {
      setShowPortraitAlbum2And3(true);
    }
  }, [selectedOptions.album_selection, setValue]);

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

  useEffect(() => {
    const updatedDisabledCheckboxes = {
      photoInAlbum: false,
      portraitAlbum2: false,
      portraitAlbum3: false,
      photoInCube: false,
      allPhotosDigital: false,
      singlePhotoDigital: false
    };

    savedPhotos.forEach(photo => {
      if (photo.selectedOptions?.lastName === selectedOptions.lastName) {
        if (photo.selectedOptions?.photoInAlbum) updatedDisabledCheckboxes.photoInAlbum = true;
        if (photo.selectedOptions?.portraitAlbum2) updatedDisabledCheckboxes.portraitAlbum2 = true;
        if (photo.selectedOptions?.portraitAlbum3) updatedDisabledCheckboxes.portraitAlbum3 = true;
        if (photo.selectedOptions?.photoInCube) updatedDisabledCheckboxes.photoInCube = true;
        if (photo.selectedOptions?.allPhotosDigital) updatedDisabledCheckboxes.allPhotosDigital = true;
        if (photo.selectedOptions?.singlePhotoDigital) updatedDisabledCheckboxes.singlePhotoDigital = true;
      }
    });

    setDisabledCheckboxes(updatedDisabledCheckboxes);
  }, [savedPhotos, selectedOptions.lastName]);

  const handleAlbumSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const albumSelection = parseInt(event.target.value, 10);
    if (albumSelection === 0) {
      setShowPortraitAlbum2And3(false);
      setValue('portraitAlbum2', false);
      setValue('portraitAlbum3', false);
    } else {
      setShowPortraitAlbum2And3(true);
    }
  };

  const onSubmit: SubmitHandler<SelectedOptions> = async (data) => {
    console.log('Form data before processing:', data);

    if ((data.photoInAlbum && data.portraitAlbum2) || (data.photoInAlbum && data.portraitAlbum3) || (data.portraitAlbum2 && data.portraitAlbum3)) {
      Swal.fire({
        title: 'Ошибка',
        text: 'Можно выбрать только одну опцию из "Портрет в альбом", "Портрет в альбом 2" или "Портрет в альбом 3" для одного фото.',
        icon: 'error',
        confirmButtonText: 'ОК'
      });
      return;
    }
    if (data.album_selection === 0 && (data.photoInAlbum || data.portraitAlbum2 || data.portraitAlbum3)) {
      Swal.fire({
        title: 'Ошибка',
        text: 'Если выбран "Не беру альбом", можно выбрать только "Портрет в альбом".',
        icon: 'error',
        confirmButtonText: 'ОК'
      });
      return;
    }

    let existingPhoto = null;

    if (data.photoInAlbum) {
      existingPhoto = savedPhotos.find(
        (photo) =>
          photo.selectedOptions?.photoInAlbum &&
          photo.selectedOptions?.lastName === data.lastName &&
          photo.id !== selectedPhoto.id
      );

      if (existingPhoto) {
        Swal.fire({
          title: 'Ошибка',
          text: 'Вы уже выбрали портрет в альбом для этой фамилии. Если хотите изменить выбор, удалите с той фамилии.',
          icon: 'error',
          confirmButtonText: 'ОК'
        });
        return;
      }
    }

    if (data.portraitAlbum2) {
      existingPhoto = savedPhotos.find(
        (photo) =>
          photo.selectedOptions?.portraitAlbum2 &&
          photo.selectedOptions?.lastName === data.lastName &&
          photo.id !== selectedPhoto.id
      );

      if (existingPhoto) {
        Swal.fire({
          title: 'Ошибка',
          text: 'Вы уже выбрали портрет в альбом 2 для этой фамилии. Если хотите изменить выбор, удалите с той фамилии.',
          icon: 'error',
          confirmButtonText: 'ОК'
        });
        return;
      }
    }

    if (data.portraitAlbum3) {
      existingPhoto = savedPhotos.find(
        (photo) =>
          photo.selectedOptions?.portraitAlbum3 &&
          photo.selectedOptions?.lastName === data.lastName &&
          photo.id !== selectedPhoto.id
      );

      if (existingPhoto) {
        Swal.fire({
          title: 'Ошибка',
          text: 'Вы уже выбрали портрет в альбом 3 для этой фамилии. Если хотите изменить выбор, удалите с той фамилии.',
          icon: 'error',
          confirmButtonText: 'ОК'
        });
        return;
      }
    }

    if (data.photoInCube) {
      existingPhoto = savedPhotos.find(
        (photo) =>
          photo.selectedOptions?.photoInCube &&
          photo.selectedOptions?.lastName === data.lastName &&
          photo.id !== selectedPhoto.id
      );

      if (existingPhoto) {
        Swal.fire({
          title: 'Ошибка',
          text: 'Вы уже выбрали фото в кубике для этой фамилии. Если хотите изменить выбор, удалите с той фамилии.',
          icon: 'error',
          confirmButtonText: 'ОК'
        });
        return;
      }
    }

    if (data.allPhotosDigital) {
      existingPhoto = savedPhotos.find(
        (photo) =>
          photo.selectedOptions?.allPhotosDigital &&
          photo.selectedOptions?.lastName === data.lastName &&
          photo.id !== selectedPhoto.id
      );

      if (existingPhoto) {
        Swal.fire({
          title: 'Ошибка',
          text: 'Вы уже выбрали все фото в электронном виде для этой фамилии. Если хотите изменить выбор, удалите с той фамилии.',
          icon: 'error',
          confirmButtonText: 'ОК'
        });
        return;
      }
    }

    const payload = {
      ...data,
      album_selection: Number(data.album_selection),
      photo_id: selectedPhoto.photo_id,
      photo_10x15: data.photo10x15 || 0,
      photo_15x21: data.photo15x21 || 0,
      photo_20x30: data.photo20x30 || 0,
      photo_count: 1, // или другое подходящее значение
      photo_chronicle: data.photoInYearbook ? 1 : 0,
      vignette: data.vignette ? 1 : 0,
      album: data.photoInAlbum ? 1 : 0,
      all_photos_digital: data.allPhotosDigital ? 1 : 0,
      portrait_album_2: data.portraitAlbum2 ? 1 : 0,
      portrait_album_3: data.portraitAlbum3 ? 1 : 0,
      single_photo_digital: data.singlePhotoDigital ? 1 : 0,
      photo_in_cube: data.photoInCube ? 1 : 0,
      file_name_id: selectedPhoto.id,
    };

    console.log('Payload to be sent to handleConfirmSelection:', payload);
    await handleConfirmSelection(payload); // Сохраняем данные в БД

    const updatedOptionsMap = {
      ...selectedOptions,
      [selectedPhoto.photo_id as number]: { // Приведение к числу
        ...payload,
        lastName: data.lastName,
      }
    };
    console.log('Before closing modal, options map:', updatedOptionsMap);
    setSelectedOptionsMap(updatedOptionsMap); // Обновляем состояние через Zustand

    closeModal(); // Закрываем модальное окно
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
          {accountType && accountType.type_name !== 'летопись' && (
            <label className={styles.formLabel}>
              Заказ альбома
              <select {...register('album_selection', { required: true })} onChange={handleAlbumSelectionChange}>
                <option value="">Выберите альбом</option>
                <option value={0}>Не беру альбом</option>
                <option value={1}>Беру альбом</option>
              </select>
              {errors.album_selection && <span className="error">Выбор альбома обязателен</span>}
            </label>
          )}

          <div className={styles.checkboxGroup}>
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
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('allPhotosDigital')} /> Все фото в электронном виде
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('singlePhotoDigital')} /> 1 фото в электронном виде
                </label>
                {commonBlocks}
              </>
            )}
            {accountType && accountType.type_name === 'альбом 2 портрета' && (
              <>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('photoInAlbum')} disabled={disabledCheckboxes.photoInAlbum} /> Портрет в альбом
                </label>
                {showPortraitAlbum2And3 && (
                  <>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" {...register('portraitAlbum2')} disabled={disabledCheckboxes.portraitAlbum2} /> Портрет в альбом 2
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" {...register('portraitAlbum3')} disabled={disabledCheckboxes.portraitAlbum3} /> Портрет в альбом 3
                    </label>
                  </>
                )}

                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('allPhotosDigital')} disabled={disabledCheckboxes.allPhotosDigital} /> Все фото в электронном виде
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('singlePhotoDigital')} disabled={disabledCheckboxes.singlePhotoDigital} /> 1 фото в электронном виде
                </label>
                {commonBlocks}
              </>
            )}
            {accountType && accountType.type_name === 'альбом 3 портрета' && (
              <>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('photoInAlbum')} disabled={disabledCheckboxes.photoInAlbum} /> Портрет в альбом
                </label>
                {showPortraitAlbum2And3 && (
                  <>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" {...register('portraitAlbum2')} disabled={disabledCheckboxes.portraitAlbum2} /> Портрет в альбом 2
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" {...register('portraitAlbum3')} disabled={disabledCheckboxes.portraitAlbum3} /> Портрет в альбом 3
                    </label>
                  </>
                )}
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('allPhotosDigital')} disabled={disabledCheckboxes.allPhotosDigital} /> Все фото в электронном виде
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('singlePhotoDigital')} disabled={disabledCheckboxes.singlePhotoDigital} /> 1 фото в электронном виде
                </label>
                {commonBlocks}
              </>
            )}
            {accountType && accountType.type_name === 'альбом кубики' && (
              <>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('photoInCube')} disabled={disabledCheckboxes.photoInCube} /> Фото в кубике
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('photoInAlbum')} disabled={disabledCheckboxes.photoInAlbum} /> Портрет в альбом
                </label>
                {showPortraitAlbum2And3 && (
                  <>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" {...register('portraitAlbum2')} disabled={disabledCheckboxes.portraitAlbum2} /> Портрет в альбом 2
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" {...register('portraitAlbum3')} disabled={disabledCheckboxes.portraitAlbum3} /> Портрет в альбом 3
                    </label>
                  </>
                )}
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('allPhotosDigital')} disabled={disabledCheckboxes.allPhotosDigital} /> Все фото в электронном виде
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register('singlePhotoDigital')} disabled={disabledCheckboxes.singlePhotoDigital} /> 1 фото в электронном виде
                </label>
                {commonBlocks}
              </>
            )}
          </div>
          <div className={styles.buttonContainer}>
            <button className={`${styles.button} ${yearbookPhotoDisabled ? styles.disabledButton : ''}`} type="submit" disabled={yearbookPhotoDisabled || !isValid}>Подтвердите выбор</button>
            <button className={styles.cancelButton} type="button" onClick={closeModal}>Отменить выбор</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhotoModal;
