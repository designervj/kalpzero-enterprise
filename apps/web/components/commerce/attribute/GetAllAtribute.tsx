"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { fetchAttributes } from "@/hook/slices/commerce/attribute/attributeThunk";
import { useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/hook/store/store";
import { usePathname } from "next/navigation";


export default function GetAllAtribute() {
    const dispatch = useDispatch<AppDispatch>();
    const pathName = usePathname();
    const segment = pathName.split("/")[1];
    console.log("segment", segment);
   const isApi= useRef<boolean>(false);
    const { authUser } = useSelector((state: RootState) => state.auth);
    const { currentTenant } = useSelector((state: RootState) => state.tenant);
    const { isFetchedAttributes } = useSelector((state: RootState) => state.attribute);

    useEffect(() => {
        if (!isFetchedAttributes &&
             segment === "commerce" &&
            authUser?.access_token &&
            currentTenant?.mongo_db_name &&
            !isApi.current
            ) {
            isApi.current = true;
            dispatch(fetchAttributes(
                {
                    'x-tenant-db': currentTenant.mongo_db_name,
                    auth_token: authUser.access_token,
                }
            ));
            }else{
            isApi.current = false;
        }
    }, [dispatch, currentTenant, isFetchedAttributes, authUser, segment]);

return null;
}