"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "../AuthProvider";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/hook/store/store";
import { fetchTenants } from "@/hook/slices/kalp_master/master_tenant/TenantThunk";

const GetAllTenant = () => {
  const authCtx = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const isApi = useRef<boolean>(false);
  const { allTenant, currentTenant, isFetchedAlltenant } = useSelector(
    (state: RootState) => state.tenant,
  );
  useEffect(() => {
    if (!authCtx.user) {
      return;
    }
    if (!isFetchedAlltenant && !isApi.current) {
      isApi.current = true;
      dispatch(fetchTenants());
    } else {
      isApi.current = false;
    }
  }, [authCtx.user, isFetchedAlltenant]);
  return null;
};

export default GetAllTenant;
