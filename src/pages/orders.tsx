import { useState, useEffect } from 'react';
import axios from 'axios';
import { Order, Photo, User } from '../types';
import './Orders.css'; // Подключаем файл стилей

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassId = async (className: string) => {
      try {
        const response = await axios.get(`/api/getClassId?class_name=${className}`);
        return response.data.class_id;
      } catch (error) {
        console.error('Ошибка при получении class_id:', error);
        return null;
      }
    };

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log('Parsed user:', parsedUser);

      if (parsedUser.class_id) {
        fetchOrders(parsedUser.class_id);
      } else if (parsedUser.class_name) {
        fetchClassId(parsedUser.class_name).then((classId) => {
          if (classId) {
            parsedUser.class_id = classId;
            localStorage.setItem('user', JSON.stringify(parsedUser));
            fetchOrders(classId);
          }
        });
      }
    }
  }, []);

  const fetchOrders = async (classId: number) => {
    try {
      console.log('Fetching orders for classId:', classId); // Логируем classId
      const response = await axios.get(`/api/orders?class_id=${classId}`);
      console.log('API response data:', response.data); // Логируем данные ответа API

      // Группировка заказов по фамилии
      const groupedOrders = response.data.reduce((acc: { [key: string]: Photo[] }, order: any) => {
        if (!acc[order.family_name]) {
          acc[order.family_name] = [];
        }
        acc[order.family_name].push({
          id: order.photo_id,
          src: `https://storage.yandexcloud.net/testphoto2/${order.file_name}.jpg`, // Добавляем .jpg к имени файла
          alt: `Фото ${order.photo_id}`,
          photoSize: `${order.photo_10x15 ? '10x15' : ''} ${order.photo_15x21 ? '15x21' : ''} ${order.photo_20x30 ? '20x30' : ''}`,
          photoType: `${order.vignette ? 'Виньетка' : ''} ${order.photo_chronicle ? 'Фото в летопись' : ''} ${order.photo_in_cube ? 'Фото в кубе' : ''}`,
          selectedOptions: {
            lastName: order.family_name,
            photo10x15: order.photo_10x15,
            photo15x21: order.photo_15x21,
            photo20x30: order.photo_20x30,
            photoInYearbook: order.photo_chronicle, // Исправлено поле
            additionalPhotos: order.additionalPhotos,
            vignette: order.vignette,
            photoInAlbum: order.album,
            allPhotosDigital: order.all_photos_digital,
            portraitAlbum2: order.portrait_album_2,
            portraitAlbum3: order.portrait_album_3,
            singlePhotoDigital: order.single_photo_digital,
            photoInCube: order.photo_in_cube,
            photo10x15Name: order.photo_10x15Name,
            photo20x30Name: order.photo_20x30Name,
            photo15x21Name: order.photo_15x21Name,
            album_selection: order.album_selection
          }
        });
        return acc;
      }, {});

      const ordersWithPhotos = Object.keys(groupedOrders).map((family_name, index) => ({
        id: `${family_name}-${index}`,
        family_name,
        photos: groupedOrders[family_name]
      }));

      console.log('Processed orders data:', ordersWithPhotos); // Логируем обработанные данные заказов
      setOrders(ordersWithPhotos);
    } catch (error) {
      console.error('Ошибка при получении заказов:', error);
    }
  };

  const toggleOrderDetails = (familyName: string) => {
    setExpandedOrder(expandedOrder === familyName ? null : familyName);
  };

  return (
    <div className="orders-container">
      <h1>Заказы школы: {user?.school_name}</h1>
      <h2>Класса: {user?.class_name}</h2>
      {orders.length > 0 ? (
        <ul className="orders-list">
          {orders.map(order => (
            <li key={order.id} className={`order-item ${expandedOrder === order.family_name ? 'expanded' : ''}`}>
              <div className="order-header" onClick={() => toggleOrderDetails(order.family_name)}>
                <h3>Фамилия: {order.family_name}</h3>
              </div>
              {expandedOrder === order.family_name && (
                <div className="order-details">
                  <div className="photos">
                    {order.photos.map((photo: Photo) => (
                      <div key={photo.id} className="photo-item">
                        <img src={photo.src} alt={photo.alt} className="photo-img"/>
                        <p>Номер фото: {photo.id}</p>
                        <p>Параметры:</p>
                        <ul>
                          {Object.entries(photo.selectedOptions!)
                            .filter(([key, value]) => value && key !== 'lastName')
                            .map(([key, value]) => (
                              <li key={key}>
                                <strong>{translateOptionKey(key)}:</strong> {value}
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Заказы отсутствуют.</p>
      )}
    </div>
  );
};

// Функция для перевода ключей на русский язык
const translateOptionKey = (key: string) => {
  const translations: { [key: string]: string } = {
    lastName: 'Фамилия',
    photo10x15: 'Фото 10x15',
    photo15x21: 'Фото 15x21',
    photo20x30: 'Фото 20x30',
    photoInYearbook: 'Фото в летопись',
    additionalPhotos: 'Дополнительные фото',
    vignette: 'Виньетка',
    photoInAlbum: 'Фото в альбоме',
    allPhotosDigital: 'Все фото в цифровом виде',
    portraitAlbum2: 'Портретный альбом 2',
    portraitAlbum3: 'Портретный альбом 3',
    singlePhotoDigital: 'Одиночное цифровое фото',
    photoInCube: 'Фото в кубе',
    photo10x15Name: 'Имя фото 10x15',
    photo20x30Name: 'Имя фото 20x30',
    photo15x21Name: 'Имя фото 15x21',
     album_selection: 'Выбор альбома'
  };
  return translations[key] || key;
};

export default Orders;
