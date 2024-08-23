import create from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface FilterState {
  selectedLastName: string;
  lastNames: string[];
  setSelectedLastName: (lastName: string) => void;
  setLastNames: (lastNames: string[]) => void;
}

const useFilterStore = create<FilterState>()(
  devtools(
    immer((set) => ({
      selectedLastName: 'Выберите фильтр',
      lastNames: [],
      setSelectedLastName: (lastName: string) => set((state: FilterState) => {
        state.selectedLastName = lastName;
      }),
      setLastNames: (lastNames: string[]) => set((state: FilterState) => {
        state.lastNames = lastNames;
      }),
    }))
  )
);

export default useFilterStore;
