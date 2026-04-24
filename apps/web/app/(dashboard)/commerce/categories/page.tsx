"use client"
import GetTenant from "@/components/adminLayout/GetTenant";
import GetAllCategories from "@/components/commerce/categories/GetAllCategories";
import ShowCategoryTable from "@/components/commerce/categories/ShowCategoryTable";

export default function CommercePage() {
    return (
        <div className="p-4 md:p-8">
            <GetTenant />
            <GetAllCategories />
            <ShowCategoryTable />
        </div>
    );
}