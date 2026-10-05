import { StaticInfoPage } from '@/components/StaticInfoPage';

export default function TermsPage() {
  return <StaticInfoPage title="Terms of use" updated="October 4, 2026">
    <section><h2>Using Omnave</h2><p>Omnave provides tools for turning study materials into generated learning resources. Users must have permission to upload their materials and must use the service lawfully.</p></section>
    <section><h2>Generated content</h2><p>AI-generated summaries, flashcards, quizzes, and tutor responses may contain mistakes. Learners should verify important academic, medical, legal, or professional information against trusted sources.</p></section>
    <section><h2>Accounts and limits</h2><p>Users are responsible for activity under their account. Free and paid plans may apply file, page, generation, and chat limits shown inside the product.</p></section>
    <section><h2>Availability</h2><p>Processing times and availability may vary because Omnave depends on storage, database, queue, and AI services. Failed or cancelled eligible operations automatically release reserved usage.</p></section>
  </StaticInfoPage>;
}
