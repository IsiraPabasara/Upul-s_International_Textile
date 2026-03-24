import { notFound } from 'next/navigation';

export default function CatchAll({ params }: { params: { slug: string[] } }) {
  // Trigger the not-found page
  notFound();
}
