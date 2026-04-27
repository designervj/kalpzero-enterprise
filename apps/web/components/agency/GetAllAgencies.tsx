"use client "
import { fetchAgencies } from '@/hook/slices/kalp_master/agencies/AgencyThunk';
import { AppDispatch, RootState } from '@/hook/store/store';
import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';

const GetAllAgencies = () => {
      const {authUser}= useSelector((state:RootState)=>state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const isApi = useRef<boolean>(false);
  const { allAgencies,isFetchedAllAgencies } = useSelector(
    (state: RootState) => state.agency,
  );
  useEffect(() => {

    if (!isFetchedAllAgencies &&
      authUser?.role==="platform_owner" 
      ) {
    
      if (authUser?.access_token) {
        dispatch(fetchAgencies({ auth_token: authUser.access_token }));
      }
    } else {
      isApi.current = false;
    }
  }, [authUser, isFetchedAllAgencies]);
  return (
null
  )
}

export default GetAllAgencies