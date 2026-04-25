"use client"

import { fetchVendors } from "@/hook/slices/commerce/vendor/VendorThunk";
import { AppDispatch, RootState } from "@/hook/store/store";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";


export default function GetAllVendors() {
         const dispatch = useDispatch<AppDispatch>();
    const pathName = usePathname();
    const segment = pathName.split("/")[1];
  ;
   const isApi= useRef<boolean>(false);
    const { authUser } = useSelector((state: RootState) => state.auth);
    const { currentTenant } = useSelector((state: RootState) => state.tenant);
    const { isFetchedVendors } = useSelector((state: RootState) => state.vendor);

    useEffect(() => {
        if (!isFetchedVendors &&
             segment === "commerce" &&
            authUser?.access_token &&
            currentTenant?.mongo_db_name &&
            !isApi.current
            ) {
            isApi.current = true;
            dispatch(fetchVendors(
                {
                    'x-tenant-db': currentTenant.mongo_db_name,
                    auth_token: authUser.access_token,
                }
            ));
            }else{
            isApi.current = false;
        }
    }, [dispatch, currentTenant, isFetchedVendors, authUser, segment]);
    return (
        null
    );
}