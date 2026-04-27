"use client"
import { AppDispatch, RootState } from '@/hook/store/store';
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import GetAllAgencies from './GetAllAgencies';
import { useParams, useSearchParams } from 'next/navigation';
import { Agency } from '@/hook/slices/kalp_master/agencies/agencyType';
import { setCurrentAgency } from '@/hook/slices/kalp_master/agencies/AgencySlice';

const GetAgencyById = () => {
  const { authUser } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const { allAgencies, currentAgency } = useSelector(
    (state: RootState) => state.agency,
  );

  const params = useParams();
  const searchParams = useSearchParams();
  
  // Get ID from path params [id] or search params ?id=...
  const agencyId = (params?.id as string) || searchParams.get("id");

  useEffect(() => {
    if (authUser && allAgencies?.length > 0 && agencyId) {
      // Check if we need to update the current agency
      // We update if currentAgency is null OR if it's a different agency than the one in the URL
      if (!currentAgency || currentAgency.id !== agencyId) {
        const agency = allAgencies.find((agency: Agency) => agency.id === agencyId);
        if (agency) {
          dispatch(setCurrentAgency(agency));
        }
      }
    }
  }, [authUser, allAgencies, agencyId, currentAgency, dispatch]);

  return (
    <GetAllAgencies />
  )
}

export default GetAgencyById
