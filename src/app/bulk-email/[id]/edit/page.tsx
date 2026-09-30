"use client";

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import BulkCampaignWizard from '@/components/BulkCampaignWizard';
import { Loader2 } from 'lucide-react';

function EditBulkCampaignContent() {
  const params = useParams();
  const campaignId = params?.id as string;

  return <BulkCampaignWizard initialCampaignId={campaignId} />;
}

export default function EditBulkCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#fafafa]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <EditBulkCampaignContent />
    </Suspense>
  );
}
