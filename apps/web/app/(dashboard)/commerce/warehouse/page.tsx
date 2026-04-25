"use client"

import WarehouseManager from "@/components/commerce/warehouse/WarehouseManager"
import GetAllWarehouse from "@/components/commerce/warehouse/GetAllWarehouse"
import GetTenant from "@/components/adminLayout/GetTenant"

export default function WarehousePage() {
    return (
        <div className="p-10">
            <WarehouseManager />
            <GetAllWarehouse />
            <GetTenant />
        </div>
    )
}
