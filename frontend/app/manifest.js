export default function manifest() {
  return {
    name: 'Kokan Ghar - Authentic Konkan Products',
    short_name: 'Kokan Ghar',
    description:
      'Shop authentic Konkan region products including Alphonso mangoes, cashews, spices, seafood, and traditional delicacies.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#2D6A4F',
    background_color: '#FAF7F0',
    lang: 'en-IN',
    categories: ['shopping', 'food'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
