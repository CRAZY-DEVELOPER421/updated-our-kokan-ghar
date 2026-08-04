import Image from 'next/image';
import Link from 'next/link';

const blogPosts = [
  {
    slug: 'alphonso-mango-season-guide',
    title: 'The Journey of Alphonso: From Devgad to Your Plate',
    readTime: '5 min read',
    category: 'Recipes',
    img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
  },
  {
    slug: 'traditional-konkan-recipes',
    title: '5 Traditional Konkan Monsoon Snacks You Must Try',
    readTime: '4 min read',
    category: 'Travel',
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  },
  {
    slug: 'goan-cashew-shopping-guide',
    title: 'How to Choose the Best Goan Cashews: W180 vs W320 vs W450',
    readTime: '6 min read',
    category: 'Tips',
    img: 'https://images.unsplash.com/photo-1577774104414-79ae0a5b1f46?w=400&q=80',
  },
  {
    slug: 'konkan-spice-guide',
    title: 'Essential Spices of the Konkan Coast and How to Use Them',
    readTime: '5 min read',
    category: 'Recipes',
    img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
  },
];

const categoryColors = {
  Recipes: '#F5821F',
  Travel: '#3B82F6',
  Tips: '#2D5F4C',
};

export default function MobileBlogSection() {
  return (
    <section>
      {/* ── Section Header ── */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '24px 16px 12px' }}
      >
        <h2
          className="font-bold"
          style={{
            fontSize: '20px',
            color: '#1A1A1A',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          From the Konkan Blog
        </h2>
        <Link
          href="/blog"
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{
            fontSize: '13px',
            color: '#2D5F4C',
          }}
        >
          View All →
        </Link>
      </div>

      {/* ── Horizontal Scroll Cards ── */}
      <div
        className="flex gap-3 overflow-x-auto"
        style={{
          paddingLeft: '16px',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {blogPosts.map((post, idx) => {
          const catColor = categoryColors[post.category] || '#2D5F4C';
          return (
            <Link
              key={idx}
              href={`/blog/${post.slug}`}
              className="shrink-0 block overflow-hidden bg-white"
              style={{
                width: '200px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {/* ── Image with overlayed category tag ── */}
              <div className="relative overflow-hidden aspect-[3/4]">
                <Image
                  src={post.img}
                  alt={post.title}
                  fill
                  sizes="200px"
                  className="object-cover"
                  loading="lazy"
                />
                {/* Category tag pill — top-left, 8px offset */}
                <span
                  className="absolute top-2 left-2 z-10 text-[10px] font-semibold text-white leading-none"
                  style={{
                    backgroundColor: catColor,
                    padding: '3px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {post.category}
                </span>
              </div>

              {/* ── Content ── */}
              <div style={{ padding: '10px 12px 12px', backgroundColor: '#3D2B1F' }}>
                <h3
                  className="font-semibold leading-snug line-clamp-2"
                  style={{
                    fontSize: '14px',
                    color: '#FFFFFF',
                  }}
                >
                  {post.title}
                </h3>
                <p
                  className="mt-1.5"
                  style={{ fontSize: '11px', color: '#FFFFFF' }}
                >
                  {post.readTime}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
