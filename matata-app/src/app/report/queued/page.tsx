'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QueuedConfirmation from '@/components/report/QueuedConfirmation';

function QueuedContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';
  return <QueuedConfirmation refId={ref} />;
}

export default function QueuedPage() {
  return (
    <Suspense>
      <QueuedContent />
    </Suspense>
  );
}
