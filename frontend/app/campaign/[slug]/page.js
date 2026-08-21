import { notFound } from 'next/navigation';
import CampaignContent from './CampaignContent';

// Runtime-resolved API base — works on localhost dev AND behind the tunnel/gateway.
function resolveApiBase() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }
  const port = window.location.port;
  if (port === '3000' || port === '3001') return 'http://localhost:5000/api';
  return '/api';
}
const API_URL = resolveApiBase();

async function getCampaign(slug) {
  try {
    const res = await fetch(`${API_URL}/campaigns/${slug}`, {
      next: { revalidate: 300 }, // cache for 5 minutes
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.campaign || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) return {};

  const title = campaign.meta_title || campaign.name;
  const description = campaign.meta_description
    || campaign.tagline
    || `Shop the ${campaign.name} collection at Konkan Ghar.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.kokanghar.in/campaign/${campaign.slug}`,
      siteName: 'Konkan Bazaar',
      images: campaign.banner_image_url
        ? [{ url: campaign.banner_image_url, width: 1200, height: 630 }]
        : undefined,
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: { canonical: `https://www.kokanghar.in/campaign/${campaign.slug}` },
  };
}

export default async function CampaignPage({ params }) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);

  if (!campaign) notFound();

  return <CampaignContent campaign={campaign} />;
}
