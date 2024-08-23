import create from 'zustand';
import axios from 'axios';
import { Photo, SelectedOptions, User } from '../types';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';


interface PhotoStore {
  user: User;
  photos: Photo[];
  savedPhotos: Photo[];
  selectedOptionsMap: { [key: number]: SelectedOptions };
  selectedPhoto: Photo | null;
  loading: boolean;
  showLightbox: boolean;
  initialIndex: number;
  selectedLastName: string;
  setUser: (user: User) => void;
  setPhotos: (photos: Photo[]) => void;
  setSavedPhotos: (photos: Photo[]) => void;
  setSelectedOptionsMap: (map: { [key: number]: SelectedOptions }) => void;
  updateSelectedOptions: (photoId: number, options: SelectedOptions) => void;
  deleteSelectedOptions: (photoId: number) => Promise<void>;
  setSelectedPhoto: (photo: Photo | null) => void;
  setLoading: (loading: boolean) => void;
  setShowLightbox: (show: boolean) => void;
  setInitialIndex: (index: number) => void;
  setSelectedLastName: (lastName: string) => void;
  fetchPhotos: (schoolName: string, className: string, classId: number) => Promise<void>;
  handleSelectPhoto: (photo: Photo) => void;
  handleDeleteSelection: (photo: Photo) => Promise<void>;
  handleConfirmSelection: (options: SelectedOptions) => Promise<void>;
  handleLastNameChange: (lastName: string) => void;
  handlePhotosChange: (filteredPhotos: Photo[]) => void;
}

const usePhotoStore = create<PhotoStore>()(
  devtools(
    immer((set, get) => ({
      user: { class_name: '', school_name: '', class_id: 0 },
      photos: [],
      savedPhotos: [],
      selectedOptionsMap: {},
      selectedPhoto: null,
      loading: false,
      showLightbox: false,
      initialIndex: 0,
      selectedLastName: 'Выберите фильтр',

      setUser: (user) => set((state) => {
        state.user = user;
      }),

      setPhotos: (newPhotos) => set((state) => {
        const updatedPhotos = state.photos.map(existingPhoto => {
          const newPhoto = newPhotos.find(p => p.id === existingPhoto.id);
          return newPhoto ? { ...existingPhoto, ...newPhoto } : existingPhoto;
        });
      
        const newPhotoIds = new Set(newPhotos.map(p => p.id));
        const additionalPhotos = newPhotos.filter(p => !state.photos.some(ep => ep.id === p.id));
      
        state.photos = [...updatedPhotos, ...additionalPhotos];
      }),

      setSavedPhotos: (photos) => set((state) => {
        state.savedPhotos = photos;
      }),

      setSelectedOptionsMap: (map) => set((state) => {
        state.selectedOptionsMap = map;
      }),

      updateSelectedOptions: (photoId, options) => {
        set((state) => {
          state.selectedOptionsMap[photoId] = options;
          const photo = state.photos.find(photo => photo.id === photoId);
          if (photo) {
            photo.selectedOptions = options;
          }
        });
      },

      deleteSelectedOptions: async (photoId) => {
        const { user, selectedOptionsMap } = get();
        const options = selectedOptionsMap[photoId];

        if (!options || !options.lastName) {
          console.error('Невозможно удалить: отсутствует фамилия для фото');
          return;
        }

        try {
          const response = await axios.delete('/api/deleteSelection', {
            data: {
              class_id: user.class_id,
              family_name: options.lastName,
              photo_id: photoId,
            },
          });

          if (response.status === 200) {
            set((state) => {
              const { [photoId]: _, ...rest } = state.selectedOptionsMap;
              const updatedPhotos = state.photos.map(photo => 
                photo.id === photoId ? { ...photo, selectedOptions: undefined } : photo
              );
              state.selectedOptionsMap = rest;
              state.photos = updatedPhotos;
            });
            console.log('Выбор успешно удален');
          }
        } catch (error) {
          console.error('Ошибка при удалении выбора:', error);
        }
      },

      setSelectedPhoto: (photo) => set((state) => {
        state.selectedPhoto = photo;
      }),

      setLoading: (loading) => set((state) => {
        state.loading = loading;
      }),

      setShowLightbox: (show) => set((state) => {
        state.showLightbox = show;
      }),

      setInitialIndex: (index) => set((state) => {
        state.initialIndex = index;
      }),

      setSelectedLastName: (lastName) => set((state) => {
        state.selectedLastName = lastName;
      }),

      fetchPhotos: async (schoolName, className, classId) => {
        const { selectedLastName } = get();

        if (selectedLastName === 'Выберите фильтр') {
          set((state) => {
            state.photos = [];
            state.loading = false;
          });
          return;
        }

        set((state) => {
          state.loading = true;
        });

        const folderPath = `schools/${schoolName}/${className}`;
        try {
          const response = await axios.get(`/api/getFolderContents`, {
            params: {
              bucketName: 'testphoto2',
              folderPath,
              classId: classId,
              singlePhotoPerFolder: 'false',
            },
          });
          const fetchedPhotos = response.data.map((item: any) => ({
            id: item.photo_id,
            src: item.src,
            alt: item.alt,
            photoSize: item.photoSize,
            photoType: item.photoType,
            selectedOptions: get().selectedOptionsMap[item.photo_id] || undefined, // Связать с selectedOptionsMap
          }));
          set((state) => {
            state.photos = fetchedPhotos;
            state.loading = false;
          });
        } catch (error) {
          console.error('Ошибка при загрузке фотографий:', error);
          set((state) => {
            state.loading = false;
          });
        }
      },

      handleSelectPhoto: (photo) => set((state) => {
        state.selectedPhoto = photo;
      }),

      handleDeleteSelection: async (photo) => {
        await get().deleteSelectedOptions(photo.id);
      },

      handleConfirmSelection: async (options) => {
        const { user, selectedPhoto, selectedOptionsMap, updateSelectedOptions } = get();

        if (!selectedPhoto) return;

        try {
          const photoMapping = get().photos.find(photo => photo.id === selectedPhoto.id);

          if (!photoMapping) {
            console.error('Маппинг фото не найден для выбранного фото:', selectedPhoto);
            return;
          }

          const payload = {
            class_id: user.class_id,
            family_name: options.lastName,
            photo_id: photoMapping.id,
            photo_in_yearbook: options.photoInYearbook ? 1 : 0,
            photo_10x15: options.photo10x15 || 0,
            photo_15x21: options.photo15x21 || 0,
            photo_20x30: options.photo20x30 || 0,
            photo_count: 1,
            photo_chronicle: options.photoInYearbook ? 1 : 0,
            vignette: options.vignette ? 1 : 0,
            album: options.photoInAlbum ? 1 : 0,
            album_selection: options.album_selection || 0,
            all_photos_digital: options.allPhotosDigital ? 1 : 0,
            portrait_album_2: options.portraitAlbum2 ? 1 : 0,
            portrait_album_3: options.portraitAlbum3 ? 1 : 0,
            single_photo_digital: options.singlePhotoDigital ? 1 : 0,
            photo_in_cube: options.photoInCube ? 1 : 0,
            file_name_id: photoMapping.id,
          };

          await axios.post('/api/saveSelection', payload);

          updateSelectedOptions(selectedPhoto.id, options); // Обновляем состояние с новыми опциями
        } catch (error) {
          console.error('Ошибка при сохранении выбора:', error);
        }
      },

      handleLastNameChange: (lastName) => {
        const { savedPhotos } = get();
        set((state) => {
          state.selectedLastName = lastName;
          state.photos = lastName ? savedPhotos.filter(photo => photo.selectedOptions?.lastName === lastName) : savedPhotos;
        });
      },

      handlePhotosChange: (filteredPhotos) => {
        const { photos } = get();
        set((state) => {
          if (filteredPhotos.length !== photos.length || !filteredPhotos.every((photo, index) => photo.id === photos[index]?.id)) {
            state.photos = filteredPhotos;
          }
        });
      },
    }))
  )
);

export default usePhotoStore;
