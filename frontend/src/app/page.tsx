import { redirect } from 'next/navigation';

export default function Home() {
  // O root pattern redirect para o dashboard
  redirect('/dashboard');
}
