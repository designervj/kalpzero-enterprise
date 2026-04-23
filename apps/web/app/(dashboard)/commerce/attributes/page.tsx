"use client"
import GetTenant from '@/components/adminLayout/GetTenant'
import GetAllAtribute from '@/components/commerce/attribute/GetAllAtribute'
import AttributeManager from '@/components/commerce/attribute/AttributeManager'
import React from 'react'

export default function AttributesPage() {
  return (
    <div className="p-6 space-y-6">
        <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Attributes</h1>
            <p className="text-slate-500">Manage your commerce attribute sets and logic fields.</p>
        </div>

        <GetTenant />
        <GetAllAtribute />
        <AttributeManager />
    </div>
  )
}