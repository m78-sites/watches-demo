/* Каталог MASDELLA — демо. Собран по Instagram @masdella.ru на 12.11.2026.
   Все кадры часов — настоящие фото магазина. img: 'p/…' — фото целиком; у моделей из MD_SHOTS
   первым кадром идёт то же фото, вырезанное на чёрный фон (img/s), вторым — шире (img/c).
   price: ориентировочная цена для демо. Магазин сам называл только: Santos Iced 9 000, Tissot 8 000,
   Pro Trek 8 000, Casio 4 000, сертификат 80 000, кейс 80 000. Остальное — примерные цены (согласовано
   с Лабазаном 12.11.2026), перед запуском заменить на прайс владельца.
   photoOnly: true — фото не вырезано: во «Все» такие идут после часов на чёрном фоне.
   Марки — как видно на циферблате или коробке. */
window.MD_CATS = [
  { id: 'all', name: 'Все' },
  { id: 'cartier', name: 'Cartier' },
  { id: 'hublot', name: 'Hublot' },
  { id: 'klassika', name: 'Rolex, Patek и другие' },
  { id: 'sport', name: 'Reward, Naviforce, SKMEI' },
  { id: 'casio', name: 'Casio, Tissot, Garmin' },
  { id: 'para', name: 'Женские и парные' },
  { id: 'keysy', name: 'Кейсы' },
  { id: 'podarki', name: 'Подарки' }
];

window.MD_ITEMS = [
  // Cartier
  { id: 't05b', cat: 'cartier', img: 'w/t05b', name: 'Cartier Santos — синий', line: 'Синий циферблат, римские цифры, винты на безеле.', price: 8500 },
  { id: 't05a', cat: 'cartier', img: 'w/t05a', name: 'Cartier Santos — зелёный', line: 'Зелёный циферблат, римские цифры, стальной браслет.', price: 8500 },
  { id: 't09', cat: 'cartier', img: 'w/t09', name: 'Cartier Santos — белый', line: 'Белый циферблат, римские цифры, сталь.', price: 8500 },
  { id: 't08', cat: 'cartier', img: 'w/t08', name: 'Cartier Santos — тёмно-синий', line: 'Глубокий синий циферблат и стальной браслет.', price: 8500 },
  { id: 't07', cat: 'cartier', img: 'w/t07', name: 'Cartier Santos Iced Skeleton', line: 'Корпус и браслет в камнях, механизм видно насквозь.', price: 9000 },
  // Hublot
  { id: 't03c', cat: 'hublot', img: 'w/t03c', name: 'Hublot Classic Fusion — синий', line: 'Чёрный корпус, синий циферблат, ремешок.', price: 8500 },
  { id: 't03a', cat: 'hublot', img: 'w/t03a', name: 'Hublot Classic Fusion Chronograph', line: 'Серый хронограф на мягком ремешке.', price: 9500 },
  { id: 't03b', cat: 'hublot', img: 'w/t03b', name: 'Hublot Classic Fusion — серый', line: 'Три стрелки и дата, ремешок.', price: 8500 },
  { id: 't04c', cat: 'hublot', img: 'w/t04c', name: 'Hublot на браслете — синий', line: 'Хронограф на стальном браслете.', price: 9500 },
  { id: 't04b', cat: 'hublot', img: 'w/t04b', name: 'Hublot на браслете — серебро', line: 'Светлый циферблат, сталь.', price: 9500 },
  { id: 't04a', cat: 'hublot', img: 'w/t04a', name: 'Hublot на браслете — графит', line: 'Тёмный корпус и браслет.', price: 9500 },
  // Rolex, Patek, AP, Omega
  { id: 't14', cat: 'klassika', img: 'w/t14', name: 'Rolex Submariner — чёрный', line: 'Чёрный циферблат и безель, стальной браслет.', price: 9500 },
  { id: 't15', cat: 'klassika', img: 'w/t15', name: 'Rolex GMT-Master — чёрный с золотом', line: 'Чёрный циферблат и золотой безель.', price: 10000 },
  { id: 't16', cat: 'klassika', img: 'w/t16', name: 'Patek Philippe Nautilus — чёрный', line: 'Восьмигранный корпус, циферблат в полоску.', price: 8500 },
  { id: 't11', ask: 'Цвет: коричневый / синий', cat: 'klassika', img: 'w/t11', name: 'Patek Philippe Nautilus — коричневый и синий', line: 'Коричневый или синий циферблат. Цена за одни часы — цвет напишите в сообщении.', price: 8500 },
  { id: 't17', cat: 'klassika', img: 'w/t17', name: 'Audemars Piguet Royal Oak Skeleton', line: 'Циферблата нет, механизм на виду. В фирменной коробке.', price: 11000 },
  { id: 't13', cat: 'klassika', img: 'w/t13', name: 'Omega × Swatch MoonSwatch — красный', line: 'Белый циферблат и красный ремешок.', price: 6500 },
  { id: 't24', cat: 'klassika', img: 'w/t24', name: 'Квадратные Iced Skeleton', line: 'Квадратный корпус полностью в камнях, механизм на виду.', price: 9000 },
  // Reward, Naviforce, SKMEI
  { id: 't19a', cat: 'sport', img: 'w/t19a', name: 'Reward — синий квадрат', line: 'Квадратный хронограф на синем каучуке.', price: 5500 },
  { id: 't19b', cat: 'sport', img: 'w/t19b', name: 'Reward — зелёный квадрат', line: 'Тот же корпус в зелёном.', price: 5500 },
  { id: 't23', cat: 'sport', img: 'w/t23', name: 'Reward — чёрный скелетон', line: 'Механизм видно через циферблат.', price: 6000 },
  { id: 't21', cat: 'sport', img: 'w/t21', name: 'Naviforce — оранжевый', line: 'Прозрачный оранжевый корпус-бочка.', price: 5000 },
  { id: 't20', cat: 'sport', img: 'w/t20', name: 'Naviforce — синий', line: 'Корпус-бочка и синий каучук.', price: 5000 },
  { id: 't02a', cat: 'sport', img: 'w/t02a', name: 'SKMEI — синий хронограф', line: 'Хронограф на стальном браслете.', price: 4500 },
  { id: 't02b', cat: 'sport', img: 'w/t02b', name: 'SKMEI — чёрный хронограф', line: 'Тот же хронограф с чёрным циферблатом.', price: 4500 },
  { id: 't01', cat: 'sport', img: 'w/t01', name: 'Хронограф на синем каучуке', line: 'Синий циферблат в цвет ремешка.', price: 5000, badge: 'Новинка' },
  { id: 't25', cat: 'sport', img: 'p/t25', name: 'Onola — прозрачный корпус', line: 'Корпус из прозрачного материала.', price: 5500, photoOnly: true },
  { id: 't26', ask: 'Цвет ремешка: …', cat: 'sport', img: 'p/t26', name: 'Квадратные «бочки» — цветные ремешки', line: 'Красный, жёлтый, белый или синий ремешок. Цена за одни часы — цвет напишите в сообщении.', price: 6000, badge: 'Новинка', photoOnly: true },
  // Casio, Tissot, Garmin
  { id: 't28', cat: 'casio', img: 'w/t28', name: 'Casio на стальном браслете', line: 'Стальной браслет, на каждый день.', price: 4000 },
  { id: 't27', cat: 'casio', img: 'p/t27', name: 'Casio Pro Trek', line: 'Крупные спортивные часы для дороги и гор.', price: 8000, photoOnly: true },
  { id: 't35', ask: 'Цвет: белый / чёрный', cat: 'casio', img: 'p/t35', name: 'Tissot PRX — белый и чёрный', line: 'Белый или чёрный циферблат, встроенный браслет. Цена за одни часы — цвет напишите в сообщении.', price: 8000, photoOnly: true },
  { id: 't31', ask: 'Модель: …', cat: 'casio', img: 'p/t31', name: 'Garmin — спортивные', line: 'Есть с оранжевым ремешком. Цена за одни часы — модель уточним в WhatsApp.', price: 14000, photoOnly: true },
  // Женские и парные
  { id: 't29', cat: 'para', img: 'w/t29', name: 'Парные Casio', line: 'Два циферблата в одной коробке. Цена за пару.', price: 8000 },
  { id: 't30', cat: 'para', img: 'p/t30', name: 'Парные на стальном браслете', line: 'В подарочной коробке и пакете. Цена за пару.', price: 9000, photoOnly: true },
  { id: 't32', ask: 'Какие: …', cat: 'para', img: 'p/t32', name: 'Cartier Panthère и Bvlgari Serpenti', line: 'Женские модели: «пантера», «змея», в камнях. Цена за одни часы — какие, напишите в сообщении.', price: 7500, photoOnly: true },
  // Кейсы
  { id: 'k02', cat: 'keysy', img: 'p/k02', name: 'Кейс на 12 «бочек»', line: 'Ореховая шкатулка, внутри 12 «бочек».', price: 80000 },
  { id: 'k03', cat: 'keysy', img: 'p/k03', name: 'Большой белый кейс', line: 'Белая шкатулка со стеклом, внутри 12 штук.', price: 85000, badge: 'Новинка' },
  { id: 'k01', cat: 'keysy', img: 'p/k01', name: 'Кейс «Цвет»', line: 'Восемь «бочек» на цветных ремешках.', price: 50000 },
  { id: 'k04', cat: 'keysy', img: 'p/k04', name: 'Белый кейс на 12', line: 'Белая шкатулка, внутри стальные модели.', price: 85000 },
  { id: 'k05', cat: 'keysy', img: 'p/k05', name: 'Чёрный кейс на 6', line: 'Шесть часов на стальных браслетах.', price: 50000 },
  { id: 'k10', cat: 'keysy', img: 'p/k10', name: 'Кейс с красной подкладкой', line: 'Шкатулка с 12 стальными часами.', price: 85000 },
  // Подарки
  { id: 't22', cat: 'podarki', img: 'p/t22', name: 'Набор из трёх в коробке М78', line: 'Чёрный, оранжевый и синий с гарантийной книжкой. Цена за набор.', price: 18000 },
  { id: 'u05', cat: 'podarki', img: 'p/u05', name: 'Подарочный сертификат 80\u00a0000\u00a0₽', line: 'Действует 6 месяцев, на любой товар. На деньги не меняется.', price: 80000 }
];

/* «Рассмотреть ближе»: настоящие фото Santos из магазина и Instagram (img/r/santos-*) */
window.MD_FEATURES = [
  { label: 'Модели', text: 'Submariner с чёрным безелем и GMT-Master с золотом. Выберите модель — покажем часы и цену.',
    imgs: ['rolex-sub', 'rolex-gmt'], names: ['Submariner', 'GMT-Master'],
    swatches: ['#15171a', '#7a3d24'], ids: ['t14', 't15'] },
  { label: 'Циферблат', text: 'Чёрный циферблат, крупные метки и окошко даты.', imgs: ['rolex-dial'], ids: ['t14'] },
  { label: 'Безель', text: 'Безель с минутной шкалой: сталь и чёрная вставка.', imgs: ['rolex-bezel'], ids: ['t14'] },
  { label: 'В коробке', text: 'Submariner в коробке М78 — так его получает покупатель.', imgs: ['rolex-box'], ids: ['t14'] },
  { label: 'В магазине', text: 'GMT-Master на подставке в магазине на Кадырова, 105.', imgs: ['rolex-stand'], ids: ['t15'] }
];

/* Лента «Другие марки»: фото магазина на чёрном. Rolex Submariner и GMT здесь нет — они выше на странице */
window.MD_MODELS = ['t03c', 't17', 't05b', 't04c', 't13', 't19a', 't21', 't11'];

/* Галерея «Главное»: ролики магазина и свои чёрно-белые кадры. cat — вкладка каталога для ссылки «Смотреть» */
window.MD_HIGHLIGHTS = [
  { video: 'v3', pos: 'left', cat: 'sport', html: 'Спортивные «бочки» на&nbsp;каучуке&nbsp;— <em>от&nbsp;5&nbsp;000&nbsp;₽</em>.' },
  { img: 'g1', pos: 'right', cat: 'cartier', html: 'Cartier Santos на&nbsp;стали: <em>синий, зелёный, белый, тёмно-синий</em> и&nbsp;в&nbsp;камнях.' },
  { video: 'v5', pos: 'left', cat: 'keysy', html: 'Кейс: шкатулка и&nbsp;<em>6–12&nbsp;штук</em> внутри, цена за&nbsp;всё.' },
  { img: 'g3', pos: 'right', cat: 'klassika', html: 'Patek Philippe Nautilus: <em>чёрный, синий, коричневый</em>.' },
  { video: 'v1', pos: 'left', html: 'По&nbsp;Шали&nbsp;— <em>в&nbsp;день заказа</em>. По&nbsp;России&nbsp;— 2–6&nbsp;дней.' }
];

/* Кейсы для ленты */
window.MD_CASES = ['k02', 'k03', 'k01', 'k04', 'k05', 'k10'];

/* Хайлайт «Отзыв»: кадры без лиц, разрешение на публикацию — от Лабазана 12.11.2026 */
window.MD_CLIENTS = ['otzyv-015', 'otzyv-001', 'otzyv-010', 'otzyv-008', 'otzyv-005', 'otzyv-017', 'otzyv-021', 'otzyv-019'];

/* Кадры моделей. Первый — часы на чёрном фоне (img/s, вырезаны заново из фото магазина в полном размере),
   второй — то же фото шире (img/c): в коробке, на подставке, на витрине. Третий, где есть, — другой кадр
   из Instagram магазина или 3D-визуализация (так и подписано). */
window.MD_SHOTS = {
  t01: ['В коробке'], t02a: ['В коробке'], t02b: ['В коробке'],
  t03a: ['В коробке'], t03b: ['В коробке'], t03c: ['В коробке'],
  t04a: ['На витрине'], t04b: ['На витрине'], t04c: ['На витрине'],
  t05b: ['В коробке'],
  t05a: ['В коробке'],
  t09: ['На подставке', ['c/t09-ruka', 'На руке']],
  t08: ['На подставке'],
  t07: ['На подставке'], t11: ['На подставке'], t15: ['На подставке'],
  t13: ['В коробке'], t14: ['В коробке'], t16: ['В руке'], t17: ['В коробке'],
  t19a: ['В коробке'], t19b: ['В коробке'], t20: ['На подставке'], t21: ['На подставке'],
  t23: ['В коробке', ['c/t23-ruka', 'В руке']], t24: ['В коробке'],
  t28: ['На подставке'], t29: ['В коробке']
};

/* Фото моделей с сайтов марок (img/n): часы спереди на чёрном, как в каталоге марки. В окне товара
   первым кадром, дальше — фото магазина. Перед запуском решить с владельцем, оставлять ли их. */
window.MD_NET = { t14: 1, t15: 1, t05a: 1, t05b: 1, t08: 1, t09: 1, t35: 1, t03a: 1, t03b: 1, t03c: 1, t04c: 1, t17: 1 };

/* Данные магазина. График, доставка и оплата — ориентировочные для демо, уточнить у владельца */
window.MD_SHOP = {
  wa: '79999075298',
  tel: '+79999075298',
  telText: '8\u00a0999\u00a0907-52-98',
  hours: 'с 10:00 до 21:00',
  open: 10,
  close: 21
};
