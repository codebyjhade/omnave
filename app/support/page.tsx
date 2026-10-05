import Link from 'next/link';
import { StaticInfoPage } from '@/components/StaticInfoPage';

export default function SupportPage() {
  return <StaticInfoPage title="Help and support" updated="October 4, 2026">
    <section><h2>Upload problems</h2><p>Check the live limits shown on the Upload page. Omnave accepts PDF files within the file-size and page limits for the current plan.</p><Link href="/upload" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#6949a8] px-5 font-semibold text-white">Open Upload</Link></section>
    <section><h2>Processing failure</h2><p>If a failure is marked retryable, use Retry on its processing card. Failed and cancelled operations release reserved quota automatically.</p></section>
    <section><h2>Offline study</h2><p>Only kits marked Offline are confirmed on this device. Quiz results completed offline are saved locally and synchronized when connectivity returns.</p></section>
    <section><h2>Account controls</h2><p>Settings provides separate actions for signing out, clearing device downloads, and permanently deleting the account.</p></section>
  </StaticInfoPage>;
}
