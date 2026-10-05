"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import SmartAddLeadModal from '@/components/SmartAddLeadModal';

export default function SmartAddLeadPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col w-full bg-[#fafafa]">
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#F16F21]" />
              <h1 className="font-heading text-2xl font-bold text-secondary">Smart Add Lead</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Instantly ingest unformatted lead text into your CRM and campaigns
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 flex items-center justify-center">
        <SmartAddLeadModal
          isOpen={modalOpen}
          onClose={() => router.push('/leads')}
          onSuccess={() => {}}
        />
      </div>
    </div>
  );
}
