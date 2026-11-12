/* НАСТРОЙКИ САЙТА. Подписи фото, видео и проектов — в content.js.
   Пути к файлам — относительно index.html. Ссылки — полные https://...
   Для своего фона положи видео в assets/video/ и поменяй background.video.
   Любое количество фото, видео и ссылок: просто добавляй объекты в списки. */
window.SITE_CONFIG = {
  name: 'GODLYECHO',
  iconStyle: 'duotone',
  fontStyle: 'unbounded',
  // Вставь исходный URL пина в source, чтобы он появился в «Об этом сайте».
  visits: { badge: 'https://hits.dwyl.com/godlyecho/godlyecho.svg?style=flat-square', timeoutMs: 8000 },
  background: { source: 'assets/video/winter-night-silent.mp4', sourceLabel: 'загруженный ролик', video: 'assets/video/winter-night-silent.mp4', poster: 'assets/video/winter-night-poster.jpg' },
  music: { src: 'assets/audio/lost-angeles-quiet.m4a', title: 'FRIENDLY THUG 52 NGG — Lost Angeles' },
  profile: {
    avatar: 'assets/profile/ilnar-framed.jpg',
    avatarAlt: 'Чёрно-белый портрет Ильнара в очках и наушниках с белой рваной рамкой',
    title: 'О себе',
    description: 'Ильнар, 17 лет. Подробнее — справа.',
    mobileDescription: 'Ильнар, 17 лет. Подробнее — ниже.',
    note: 'GODLYECHO — от английских godly («божественный») и echo («эхо»).' ,
    facts: [['Занятия', 'Вайбкодинг и видеоигры'], ['Интересы', 'Саморазвитие'], ['Слушаю', 'Рэп и трэп']],
  },
  links: [
    { title: 'Контакт в Telegram', subtitle: 't.me/godlyecho', url: 'https://t.me/godlyecho', icon: 'telegram-contact.svg' },
    { title: 'Telegram-канал', subtitle: '@godlyecho52', url: 'https://t.me/godlyecho52', icon: 'telegram-channel.svg' },
    { title: 'YouTube', subtitle: '@godlyechoo', url: 'https://www.youtube.com/@godlyechoo', icon: 'youtube.svg' },
    { title: 'Twitch', subtitle: 'twitch.tv/godlyecho', url: 'https://www.twitch.tv/godlyecho', icon: 'twitch.svg' },
    { title: 'TikTok', subtitle: '@godlyecho', url: 'https://www.tiktok.com/@godlyecho', icon: 'tiktok.svg' },
    { title: 'Instagram', subtitle: '@god1yecho', url: 'https://www.instagram.com/god1yecho?xtok=cTg2bG0yb2d6M3Jn&utm_source=qr', icon: 'instagram.svg' },
    { title: 'SoundCloud', subtitle: 'ilka-ytb', url: 'https://soundcloud.com/ilka-ytb', icon: 'soundcloud.svg' },
    { title: 'Донат', subtitle: 'DonationAlerts', url: 'https://www.donationalerts.com/r/godlyecho812', icon: 'donation.svg' },
  ],
};
