import React, { useState } from 'react';
import styles from '../app/Gallery.module.css';

interface LastNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lastName: string) => void;
}

const LastNameModal: React.FC<LastNameModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [lastName, setLastName] = useState<string>('');

  const handleConfirm = () => {
    if (lastName.trim()) {
      onConfirm(lastName);
    } else {
      alert("Введите фамилию");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2>Введите вашу фамилию</h2>
        <input 
          type="text" 
          value={lastName} 
          onChange={(e) => setLastName(e.target.value)} 
          placeholder="Фамилия" 
          className={styles.inputField} 
        />
        <div className={styles.buttonContainer}>
          <button className={styles.button} onClick={handleConfirm}>Подтвердить</button>
          <button className={styles.cancelButton} onClick={onClose}>Отменить</button>
        </div>
      </div>
    </div>
  );
};

export default LastNameModal;
