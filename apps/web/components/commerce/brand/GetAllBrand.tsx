"use client"

import { AppDispatch, RootState } from "@/lib/store";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBrands } from "@/hook/slices/commerce/brand/BrandThunk";

export default function GetAllBrand() {
     const dispatch = useDispatch<AppDispatch>();
    const pathName = usePathname();
    const segment = pathName.split("/")[1];
  ;
   const isApi= useRef<boolean>(false);
    const { authUser } = useSelector((state: RootState) => state.auth);
    const { currentTenant } = useSelector((state: RootState) => state.tenant);
    const { isFetchedBrands } = useSelector((state: RootState) => state.brand);

    useEffect(() => {
        if (!isFetchedBrands &&
             segment === "commerce" &&
            authUser?.access_token &&
            currentTenant?.mongo_db_name &&
            !isApi.current
            ) {
            isApi.current = true;
            dispatch(fetchBrands(
                {
                    'x-tenant-db': currentTenant.mongo_db_name,
                    auth_token: authUser.access_token,
                }
            ));
            }else{
            isApi.current = false;
        }
    }, [dispatch, currentTenant, isFetchedBrands, authUser, segment]);
    return (
       null
    )
}