"use client"

import React from 'react';
import { AgencySettingsForm } from '@/components/agency/AgencySettingsForm';

const page = () => {
  return (
    <div className="mx-auto w-full max-w-4xl p-6 md:p-8">
      <AgencySettingsForm />
    </div>
  )
}

export default page