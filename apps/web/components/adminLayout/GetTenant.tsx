"use client"

import { useAuth } from "../providers/auth-provider";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useAppDispatch } from "@/lib/hooks";
import { AppDispatch } from "@/hook/store/store";
import { fetchTenantById } from "@/hook/slices/kalp_master/master_tenant/TenantThunk";

const GetTenant = () => {
    const { authUser } = useSelector((state: RootState) => state.auth)
    console.log("authUser---->", authUser)
    const dispatch = useDispatch<AppDispatch>()
    const isApi = useRef<boolean>(false)
    const router = useRouter();
    useEffect(() => {

        const getTenantInfo = async () => {
            if (authUser?.id && authUser?.access_token) {
                const response = await dispatch(
                    fetchTenantById({ id: authUser.id, auth_token: authUser.access_token })
                );

                console.log("current tetnat", response)
                // Optionally handle the response or router.push
            }
        };

        if (authUser?.role === "tenant_admin" && !isApi.current) {
            isApi.current = true;
            getTenantInfo();
        } else {
            isApi.current = false;
        }
    }, [dispatch, authUser]);
    return null;
}


export default GetTenant;
