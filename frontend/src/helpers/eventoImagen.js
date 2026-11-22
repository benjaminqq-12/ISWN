const crearBannerSvg = (titulo, subtitulo, fondo, acento, icono) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
      <rect width="400" height="280" fill="${fondo}"/>
      <circle cx="340" cy="40" r="90" fill="${acento}" fill-opacity="0.14"/>
      <circle cx="50" cy="240" r="75" fill="${acento}" fill-opacity="0.12"/>
      <text x="200" y="122" text-anchor="middle" font-size="54">${icono}</text>
      <text x="200" y="176" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${acento}">${titulo}</text>
      <text x="200" y="204" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#5E524B">${subtitulo}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const BANNERS_POR_CATEGORIA = {
    adopcion: crearBannerSvg('Adopción', 'Encuentra a tu nuevo compañero', '#FDEEE6', '#C65A34', '🐾'),
    salud: crearBannerSvg('Salud', 'Jornada veterinaria y cuidado', '#EAF3EE', '#486C5D', '🩺'),
    taller: crearBannerSvg('Taller', 'Aprendizaje comunitario', '#F4EFEA', '#8B5A2B', '📘'),
    feria: crearBannerSvg('Feria', 'Encuentro solidario del refugio', '#FFF3E0', '#B54825', '🎪'),
    default: crearBannerSvg('Evento', 'Hogar de Mascotas', '#FAF7F2', '#C65A34', '🐶'),
};

export const obtenerImagenEvento = (evento) => {
    if (evento?.imagenURL) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        return `${baseUrl}${evento.imagenURL}`;
    }
    const clave = String(evento?.categoria || '').toLowerCase();
    return BANNERS_POR_CATEGORIA[clave] || BANNERS_POR_CATEGORIA.default;
};

export const obtenerFallbackEvento = (categoria) => {
    const clave = String(categoria || '').toLowerCase();
    return BANNERS_POR_CATEGORIA[clave] || BANNERS_POR_CATEGORIA.default;
};
