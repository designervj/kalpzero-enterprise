"use client"

import { useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchProducts } from "@/hook/slices/commerce/products/ProductThunk"

import { usePathname } from "next/navigation"
import { AppDispatch, RootState } from "@/hook/store/store"


export default function GetAllProducts() {
 
    const { isFetchedProducts } = useSelector((state: RootState) => state.product)

    const dispatch = useDispatch<AppDispatch>();
    const pathName = usePathname();
    const segment = pathName.split("/")[1];
    console.log("segment", segment);
   const isApi= useRef<boolean>(false);
    const { authUser } = useSelector((state: RootState) => state.auth);
    const { currentTenant } = useSelector((state: RootState) => state.tenant);

    useEffect(() => {
        if (!isFetchedProducts &&
             segment === "commerce" &&
            authUser?.access_token &&
            currentTenant?.mongo_db_name &&
            !isApi.current
            ) {
            isApi.current = true;
            dispatch(fetchProducts(
                {
                    'x-tenant-db': currentTenant.mongo_db_name,
                    auth_token: authUser.access_token,
                }
            ));
            }else{
            isApi.current = false;
        }
    }, [dispatch, currentTenant, isFetchedProducts, authUser, segment]);


    return (
       
   null
    )
}