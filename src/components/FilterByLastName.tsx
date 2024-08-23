import React, { useEffect } from 'react';
import axios from 'axios';
import useFilterStore from '../store/filterStore'; // Импортируем хранилище для фильтрации
import styles from './FilterByLastName.module.css'; // Используем CSS
import { Photo } from '../types';

type FilterByLastNameProps = {
  classId: number;
  schoolName: string;
  className: string;
  selectedLastName: string;
  onLastNameChange: (lastName: string) => void;
  onPhotosChange: (photos: Photo[]) => void;
};

const FilterByLastName: React.FC<FilterByLastNameProps> = ({ classId, onPhotosChange, schoolName, className }) => {
  const { selectedLastName, lastNames, setSelectedLastName, setLastNames } = useFilterStore();

  useEffect(() => {
    // Установите значение "Выберите фильтр" при монтировании компонента
    setSelectedLastName("Выберите фильтр");

    const fetchLastNames = async () => {
      try {
        console.log(`Fetching last names for class ID: ${classId}`);
        const response = await axios.get(`/api/families?class_id=${classId}`);
        
        const fetchedFamilies = response.data.families;
        const fetchedLastNames = fetchedFamilies.map((family: any) => family.family_name);

        console.log('Fetched last names:', fetchedLastNames);
        setLastNames(fetchedLastNames);
      } catch (error) {
        console.error('Error fetching family names:', error);
      }
    };

    fetchLastNames();
  }, [classId, setLastNames, setSelectedLastName]);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!selectedLastName || selectedLastName === "Выберите фильтр") {
        console.log('No last name selected, resetting photo list');
        onPhotosChange([]);
        return;
      }

      let folderPath: string;

      if (selectedLastName === "Все") {
        folderPath = `schools/${schoolName}/${className}/`;
        console.log('Loading all photos for class:', classId);
      } else {
        try {
          const pathResponse = await axios.get(`/api/filterByLastName`, {
            params: {
              classId: classId,
              lastName: selectedLastName,
            },
          });

          const folders = pathResponse.data.folders;
          console.log('Folders returned by API:', folders);

          if (!folders || folders.length === 0) {
            console.log('Путь для выбранной фамилии не найден');
            onPhotosChange([]);
            return;
          }

          folderPath = folders[0];
        } catch (error) {
          console.error('Error fetching folder path by last name:', error);
          onPhotosChange([]);
          return;
        }
      }

      try {
        console.log('Fetching photos from folder path:', folderPath);
        
        const response = await axios.get(`/api/getFolderContents`, {
          params: {
            bucketName: 'testphoto2',
            folderPath,
            classId: classId,
            singlePhotoPerFolder: 'false',
          },
        });

        const filteredPhotos = response.data.map((item: any) => ({
          ...item,
          photo_id: item.photo_id || item.id,
        }));
        
        onPhotosChange(filteredPhotos);
        console.log('Filtered photos:', filteredPhotos);
      } catch (error) {
        console.error('Error fetching photos:', error);
        onPhotosChange([]);
      }
    };
  
    fetchPhotos();
  }, [selectedLastName, classId, onPhotosChange, schoolName, className]);

  return (
    <div className={styles.selectContainer}>
      <label htmlFor="lastNameFilter" className={styles.label}>
        Фильтр по фамилии:
      </label>
      <select
        id="lastNameFilter"
        value={selectedLastName}
        onChange={(e) => setSelectedLastName(e.target.value)}
        className={styles.customSelect} // Используем стиль из CSS
      >
        <option value="Выберите фильтр">Выберите фильтр</option>
        <option value="Все">Все</option>
        {lastNames.map((lastName) => (
          <option key={lastName} value={lastName}>
            {lastName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterByLastName;
