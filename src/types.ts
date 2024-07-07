export type SelectedOptions = {
  lastName: string;
  photo10x15: number;
  photo15x21: number;
  photo20x30: number;
  photoInYearbook: boolean;
  additionalPhotos: boolean;
  vignette: boolean;
  photoInAlbum: boolean;
  allPhotosDigital: boolean;
  portraitAlbum2: boolean;
  portraitAlbum3: boolean;
  singlePhotoDigital: boolean;
  photoInCube: boolean;
  photo10x15Name: string;
  photo20x30Name: string;
  photo15x21Name: string;
};

export type Family = {
  id: number;
  class_id: number;
  family_name: string;
  photo_chronicle: boolean;
  vignette: boolean;
  photo_10x15: number;
  photo_20x30: number;
  file_name_id: number | null;
};

export type Photo = {
  id: number;
  src: string;
  alt: string;
  photoSize: string; // Добавляем свойство для размера фото
  photoType: string; // Добавляем свойство для типа фото
  photo_id?: number;
  additionalPhotos?: string[];
};

export type Order = {
  lastName: string;
  photos: Photo[];
};

export type User = {
  class_name: string;
  school_name: string;
  class_id: number;
};

export type Class = {
  id: number;
  class_name: string;
  login: string;
  password: string;
  school_name: string;
};

export type FamilyPhoto = {
  id: number;
  family_id: number;
  photo_id: number;
  photo_size: string;
  photo_count: number;
  photo_chronicle: boolean;
  vignette: boolean;
  album: boolean;
  file_name_id: number | null;
  class_id: number;
  all_photos_digital: boolean;
  portrait_album_2: boolean;
  portrait_album_3: boolean;
  single_photo_digital: boolean;
  photo_in_cube: boolean;
};

export type FileName = {
  id: number;
  file_name: string;
};

export type AccountType = {
  id: number;
  type_name: string;
};

