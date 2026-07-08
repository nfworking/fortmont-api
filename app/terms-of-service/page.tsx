import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Fortmont · Terms of Service",
};

export default function TermsOfServicePage() {
  return (
    <div className="relative min-h-svh bg-zinc-950 text-zinc-100 flex flex-col items-center p-6 md:p-12 overflow-y-auto">
      {/* Subtle Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl space-y-8 z-10">
        {/* Header & Back Button */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <FileText className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Legal</p>
              <h1 className="text-2xl font-bold tracking-tight">Terms of Service</h1>
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
            <h2 className="text-lg font-semibold text-white">1. Agreement to Terms</h2>
            <p>
              By accessing or using Fortmont Web (the "Platform"), you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, you may not access or use the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. Account Registration and Security</h2>
            <p>
              To access most features of the Platform, you must register for an account. You agree to provide accurate, current, and complete information during registration. 
              You are solely responsible for maintaining the confidentiality of your account credentials (including passwords and two-factor authentication secrets) and for all activities that occur under your account. 
              Notify the system administrator immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. Acceptable Use Policy</h2>
            <p>You agree not to use the Platform to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Upload, transmit, or store any content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable.</li>
              <li>Attempt to gain unauthorized access to other user accounts, servers, databases, or network infrastructure.</li>
              <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity.</li>
              <li>Utilize the Platform's storage or proxy features to host malicious code, execute denial-of-service attacks, or send unsolicited bulk mail.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. User Content and Storage Quotas</h2>
            <p>
              You retain ownership of any files, emails, or messages you upload or create on the Platform. 
              We reserve the right to establish storage space quotas (default: 1GB) and limit bandwidth utilization. 
              Any inactive account may be subject to deletion after a specified period of notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Intellectual Property</h2>
            <p>
              The Platform's source code, design layouts, graphics, and system architecture are the exclusive property of Fortmont Inc. and its licensors. 
              You may not copy, modify, distribute, or reverse-engineer any portion of the Platform without prior written consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">6. Limitation of Liability</h2>
            <p>
              The Platform is provided on an "as-is" and "as-available" basis. To the maximum extent permitted by law, we disclaim all warranties and shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of, or inability to use, the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account and restrict your access to the Platform at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or the Platform's integrity.
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
