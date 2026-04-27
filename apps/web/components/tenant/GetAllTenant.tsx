"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "../AuthProvider";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/hook/store/store";
import { fetchTenants } from "@/hook/slices/kalp_master/master_tenant/TenantThunk";

const GetAllTenant = () => {

  const {authUser}= useSelector((state:RootState)=>state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const isApi = useRef<boolean>(false);
  const { allTenant, currentTenant, isFetchedAlltenant } = useSelector(
    (state: RootState) => state.tenant,
  );
  useEffect(() => {

    if (!isFetchedAlltenant &&
      authUser?.role==="platform_owner" && 
      !isApi.current) {
      isApi.current = true;
    
      if (authUser?.access_token) {
        dispatch(fetchTenants({ auth_token: authUser.access_token }));
      }
    } else {
      isApi.current = false;
    }
  }, [authUser, isFetchedAlltenant]);
  return null;
};

export default GetAllTenant;
