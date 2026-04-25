"use client"

import BrandManager from "@/components/commerce/brand/BrandManager"
import GetAllBrand from "@/components/commerce/brand/GetAllBrand"
import GetAllTenant from "@/components/tenant/GetAllTenant"

export default function BrandPage() {
    return (
        <div className="p-10">
            <BrandManager />
            <GetAllBrand />
            <GetAllTenant/>
        </div>
    )
}