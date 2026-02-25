"use client"

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
  return <HotToaster position="bottom-right" />;
}

export { toast } from 'react-hot-toast';
