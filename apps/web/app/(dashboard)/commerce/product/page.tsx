"use client"

import ProductManager from "@/components/commerce/products/ProductManager";
import GetAllProducts from "@/components/commerce/products/GetAllProducts";
import GetTenant from "@/components/adminLayout/GetTenant";
import GetAllCategories from "@/components/commerce/categories/GetAllCategories";
import GetAllAtribute from "@/components/commerce/attribute/GetAllAtribute";

export default function ProductsPage() {
    return (
        <div className="p-10">

            <GetTenant />
            <GetAllAtribute />
            <GetAllCategories />
            <GetAllProducts />
            <ProductManager />
        </div>
    )
}