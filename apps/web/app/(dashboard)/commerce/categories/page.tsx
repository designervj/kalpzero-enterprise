"use client"
import GetTenant from "@/components/adminLayout/GetTenant";
import GetAllCategories from "@/components/commerce/categories/GetAllCategories";
import ShowCategoryTable from "@/components/commerce/categories/ShowCategoryTable";

export default function CommercePage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-100">Categories</h1>
                <p className="text-slate-500">Manage your commerce categories, slugs, and visibility status.</p>
            </div>

            <GetTenant />
            <GetAllCategories />
            <ShowCategoryTable />
        </div>
    );
}