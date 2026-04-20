import { fetchFeatures } from '@/hook/slices/system/featureSlice/FeatureThunk';
import { AppDispatch, RootState } from '@/hook/store/store';
import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';

const GetAllFeatures = () => {
        const dispatch = useDispatch<AppDispatch>();
    const { isFetchedFeature, allFeatures } = useSelector((state: RootState) => state.feature);
   const isApi= useRef(false)
    useEffect(() => {
      if(!isFetchedFeature && !isApi.current){
        dispatch(fetchFeatures());
        isApi.current=true
      }else{
        isApi.current=false
      }
    }, [dispatch,isFetchedFeature,allFeatures]);

  return (
null
  )
}

export default GetAllFeatures