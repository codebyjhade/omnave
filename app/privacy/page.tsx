import { StaticInfoPage } from '@/components/StaticInfoPage';

export default function PrivacyPage() {
  return <StaticInfoPage title="Privacy policy" updated="October 4, 2026">
    <section><h2>Information Omnave processes</h2><p>Omnave processes account details, uploaded study materials, generated study content, quiz results, progress, usage limits, and technical events needed to operate and secure the service.</p></section>
    <section><h2>How information is used</h2><ul><li>Generate summaries, flashcards, quizzes, and tutor responses.</li><li>Save learning progress and enforce plan limits.</li><li>Diagnose failed jobs, prevent abuse, and improve reliability.</li></ul></section>
    <section><h2>Storage and AI processing</h2><p>Uploaded files and generated study data are stored with the account. Relevant material may be sent to configured AI providers to generate requested learning content. Offline copies may also be stored on the learner’s device.</p></section>
    <section><h2>Deletion</h2><p>Learners can permanently delete their account from Settings. This removes the account, stored study material, generated content, progress records, and associated files. Offline copies on the current device are also cleared during the deletion flow.</p></section>
  </StaticInfoPage>;
}
