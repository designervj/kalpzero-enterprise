"use client"

import { AppDispatch } from "@/hook/store/store";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/hook/store/store";
import GetAllTenant from "./GetAllTenant";
import { TenantSwitcherOption } from "@/hook/slices/kalp_master/master_tenant/tenantType";
import { setCurrentTenant } from "@/hook/slices/kalp_master/master_tenant/TenantSlice";

export default function FetchTenantId() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {currentTenant, allTenant} = useSelector((state:RootState)=>state.tenant)
  // pathname is like: /settings/tenant/[id]
  // searchParams might contain id
  
  const idFromPath = pathname.split("/settings/tenant/")[1];
  const idFromSearch = searchParams.get("id");

  const dispatch= useDispatch<AppDispatch>()
  const isApi= useRef<boolean>(false)

  useEffect(()=>{
    if(currentTenant==null && !isApi.current && allTenant.length>0){
        isApi.current=true
        const tenant:TenantSwitcherOption|undefined = allTenant.find((tenant:TenantSwitcherOption)=>tenant.id==idFromPath || tenant.id==idFromSearch)
        if(tenant){
            dispatch(setCurrentTenant(tenant))
        }
        
    }
    
  }, [currentTenant,allTenant])
  return (
<GetAllTenant/>
  );
}