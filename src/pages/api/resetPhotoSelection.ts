import { Dispatch, SetStateAction } from 'react';
import { SelectedOptions, Photo } from '../../types';

export const resetPhotoSelection = (
  setSelectedPhoto: Dispatch<SetStateAction<Photo | null>>,
  setSelectedOptions: Dispatch<SetStateAction<SelectedOptions>>
) => {
  console.log('Resetting photo selection');
  setSelectedPhoto(null);
  setSelectedOptions({
    lastName: '',
    photo10x15: 0,
    photo20x30: 0,
    photoInYearbook: false,
    additionalPhotos: false,
    vignette: false,
    photo10x15Name: '',
    photo20x30Name: '',
    photoInAlbum: false,
  });
};
