import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Fortmont · Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-svh bg-zinc-950 text-zinc-100 flex flex-col items-center p-6 md:p-12 overflow-y-auto">
      {/* Subtle Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl space-y-8 z-10">
        {/* Header & Back Button */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Legal</p>
              <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 border-zinc-800 hover:bg-zinc-900 text-zinc-300 animate-in fade-in" asChild>
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </Button>
        </div>

        {/* Content Card */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 md:p-8 space-y-6 text-zinc-300 leading-relaxed text-sm">
          <p className="text-xs text-zinc-500">Last updated: July 8, 2026</p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">1. Introduction</h2>
            <p>
              Welcome to Fortmont Web ("we," "our," or "us"). We are committed to protecting your privacy and security. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including our email services, file storage, operational tools, and developer portals.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. Information We Collect</h2>
            <p>We collect information you provide directly, as well as data generated automatically during your use of the platform:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Profile:</strong> Username, display name, email, phone number, and password hashes.</li>
              <li><strong>Third-Party Integrations:</strong> Linked accounts (such as GitHub OAuth tokens and Microsoft Entra ID claims) that you connect to customize your dashboard.</li>
              <li><strong>Operational & Storage Data:</strong> Encrypted email account credentials, uploaded files (stored securely on our S3 compatible servers), ticketing logs, and comments.</li>
              <li><strong>Log Data & Cookies:</strong> Active session records (IP address, user agent, login times) used to secure your account and identify anomalous access.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. How We Protect Your Data</h2>
            <p>
              Security is a foundational pillar of our service. We utilize industry-standard cryptographic practices to protect your data. 
              Passphrases and mailbox credentials are encrypted at rest using AES-256-GCM. Personal session tokens and JWTs are signed and verified on every server request.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. Data Sharing and Transfer</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We only share information with third-party service providers (such as AWS/SeaweedFS for file hosting or Firebase/FCM for notifications) to the extent necessary to deliver core platform services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Your GDPR and Privacy Rights</h2>
            <p>Under privacy frameworks such as the GDPR and CCPA, you have specific rights concerning your personal information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right to be Forgotten:</strong> You can permanently delete your account and all associated files, mailboxes, and sessions at any time through your account settings.</li>
              <li><strong>Right to Portability:</strong> You can download a complete structured export of your account data directly from the preferences panel.</li>
              <li><strong>Right of Access:</strong> You can request a copy of all processing activities related to your identity.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">6. Changes to this Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">7. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data protection rights, please contact the administrator.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-600">
          &copy; 2026 Fortmont Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
}
