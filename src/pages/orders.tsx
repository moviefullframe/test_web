import React, { useState, useEffect } from 'react';
import axios from 'axios';
import YandexDiskService from '../services/YandexDiskService';
import styles from '../app/Gallery.module.css';
import { Photo, Order } from '../types';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedPhoto, setExpandedPhoto] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const className = user.class_name;
        const schoolName = user.school_name; // Получаем school_name из user

        if (!className || !schoolName) {
          console.error('Class name or school name not found');
          return;
        }

        const response = await axios.get(`/api/order_summary?className=${className}`);
        if (response.status === 200) {
          const groupedOrders: { [key: string]: Order } = {};

          for (const orderItem of response.data) {
            if (!groupedOrders[orderItem.family_name]) {
              groupedOrders[orderItem.family_name] = {
                lastName: orderItem.family_name,
                photos: [],
              };
            }

            const folderPath = `schools/${schoolName}/${className}`;
            const items = await YandexDiskService.getFolderContents(folderPath);

            const photoItem = items.find((item: any) => item.name === orderItem.file_name);
            if (photoItem) {
              groupedOrders[orderItem.family_name].photos.push({
                id: orderItem.photo_id,
                src: photoItem.file,
                alt: orderItem.file_name,
                additionalPhotos: [],
                photoSize: photoItem.photoSize || 'defaultSize', // добавлено
                photoType: photoItem.photoType || 'defaultType', // добавлено
              });
            }
          }

          setOrders(Object.values(groupedOrders));
        } else {
          console.error('Orders not found');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  const toggleExpandPhoto = (orderIndex: number, photoIndex: number) => {
    const key = `${orderIndex}-${photoIndex}`;
    setExpandedPhoto((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Страница заказов</h1>
      <div>
        {orders.length === 0 ? (
          <p>Нет заказов для отображения</p>
        ) : (
          orders.map((order, orderIndex) => (
            <div key={orderIndex} style={{ marginBottom: '30px', textAlign: 'left' }}>
              <h2>Заказ для: {order.lastName}</h2>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
                {order.photos.map((photo, photoIndex) => (
                  <div key={photoIndex} style={{ border: '1px solid #000', padding: '10px' }}>
                    <img
                      src={photo.src}
                      alt={`Фото ${photoIndex + 1}`}
                      style={{ width: '200px', height: '200px' }}
                    />
                    <p>{photo.alt}</p>
                    {photo.additionalPhotos && photo.additionalPhotos.length > 0 && (
                      <div>
                        <button onClick={() => toggleExpandPhoto(orderIndex, photoIndex)}>
                          {expandedPhoto[`${orderIndex}-${photoIndex}`] ? 'Скрыть' : 'Показать другие фото'}
                        </button>
                        {expandedPhoto[`${orderIndex}-${photoIndex}`] && (
                          <div>
                            {photo.additionalPhotos.map((additionalPhoto: string, index: number) => (
                              <img
                                key={index}
                                src={additionalPhoto}
                                alt={`Дополнительное фото ${index + 1}`}
                                style={{ width: '100px', height: '100px', marginTop: '10px' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
