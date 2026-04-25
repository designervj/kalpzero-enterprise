"use client"

import { fetchWarehouses } from "@/hook/slices/commerce/warehouse/WarehouseThunk";
import { AppDispatch, RootState } from "@/hook/store/store";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";


export default function GetAllWarehouse() {
    const dispatch = useDispatch<AppDispatch>();
    const pathName = usePathname();
    const segment = pathName.split("/")[1];

    const isApi = useRef<boolean>(false);
    const { authUser } = useSelector((state: RootState) => state.auth);
    const { currentTenant } = useSelector((state: RootState) => state.tenant);
    const { isFetchedWarehouses } = useSelector((state: RootState) => state.warehouse);

    useEffect(() => {
        if (!isFetchedWarehouses &&
             segment === "commerce" &&
            authUser?.access_token &&
            currentTenant?.mongo_db_name &&
            !isApi.current
            ) {
            isApi.current = true;
            dispatch(fetchWarehouses(
                {
                    'x-tenant-db': currentTenant.mongo_db_name,
                    auth_token: authUser.access_token,
                }
            ));
            }else{
            isApi.current = false;
        }
    }, [dispatch, currentTenant, isFetchedWarehouses, authUser, segment]);
    return (
        null
    );
}
