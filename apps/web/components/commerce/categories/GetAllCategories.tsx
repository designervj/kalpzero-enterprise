"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/hook/store/store";
import { usePathname } from "next/navigation";
import { fetchCategories } from "@/hook/slices/commerce/category/categoryThunk";


export default function GetAllCategories() {
    const dispatch = useDispatch<AppDispatch>();
    const pathName = usePathname();
    const segment = pathName.split("/")[1];
  ;
   const isApi= useRef<boolean>(false);
    const { authUser } = useSelector((state: RootState) => state.auth);
    const { currentTenant } = useSelector((state: RootState) => state.tenant);
    const { isFetchedCategories } = useSelector((state: RootState) => state.category);

    useEffect(() => {
        if (!isFetchedCategories &&
             segment === "commerce" &&
            authUser?.access_token &&
            currentTenant?.mongo_db_name &&
            !isApi.current
            ) {
            isApi.current = true;
            dispatch(fetchCategories(
                {
                    'x-tenant-db': currentTenant.mongo_db_name,
                    auth_token: authUser.access_token,
                }
            ));
            }else{
            isApi.current = false;
        }
    }, [dispatch, currentTenant, isFetchedCategories, authUser, segment]);

return null;
}