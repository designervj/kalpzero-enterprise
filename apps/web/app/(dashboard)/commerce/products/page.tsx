"use client"

import ProductManager from "@/components/commerce/products/ProductManager";
import GetAllProducts from "@/components/commerce/products/GetAllProducts";

export default function ProductsPage() {
    return (
        <div className="p-10">
            <GetAllProducts />
            <ProductManager />
        </div>
    )
}