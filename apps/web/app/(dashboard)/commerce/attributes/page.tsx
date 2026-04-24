"use client"
import GetTenant from '@/components/adminLayout/GetTenant'
import GetAllAtribute from '@/components/commerce/attribute/GetAllAtribute'
import AttributeManager from '@/components/commerce/attribute/AttributeManager'
import React from 'react'

export default function AttributesPage() {
  return (
    <div className="p-4 md:p-8">
        <GetTenant />
        <GetAllAtribute />
        <AttributeManager />
    </div>
  )
}