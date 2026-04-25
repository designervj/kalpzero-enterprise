"use client"

import VendorManager from "@/components/commerce/vendor/VendorManager"
import GetAllVendors from "@/components/commerce/vendor/GetAllVendors"
import GetAllTenant from "@/components/tenant/GetAllTenant"
import GetTenant from "@/components/adminLayout/GetTenant"

export default function VendorPage() {
    return (
        <div className="p-10">
            <VendorManager />
            <GetAllVendors />
            {/* <GetAllTenant/> */}
            <GetTenant />
        </div>
    )
}
