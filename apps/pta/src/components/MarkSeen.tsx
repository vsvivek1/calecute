'use client';

import { useEffect } from 'react';
import { markHomeworkSeen } from '@/app/actions';

export default function MarkSeen({ student }: { student: string }) {
  useEffect(() => {
    void markHomeworkSeen(student);
  }, [student]);
  return null;
}
