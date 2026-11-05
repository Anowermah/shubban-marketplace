import { redirect } from 'next/navigation';

interface PublicationsPageProps {
  searchParams: {
    magazine?: string;
    search?: string;
  };
}

export default function PublicationsPage({ searchParams }: PublicationsPageProps) {
  const query = new URLSearchParams(searchParams as any).toString();
  redirect(`/magazine${query ? `?${query}` : ''}`);
}
