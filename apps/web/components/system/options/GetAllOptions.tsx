import { fetchOptions } from '@/hook/slices/system/optionSlice/OptionThunk';
import { AppDispatch, RootState } from '@/hook/store/store';
import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';

const GetAllOptions = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {isFetchedOption,allOptions}= useSelector((state:RootState)=>state.option)
    const isApi= useRef(false)
   useEffect(() => {
    if(!isFetchedOption && !isApi.current){
        dispatch(fetchOptions());
        isApi.current=true
    }else{
        isApi.current=false
    }
   }, [dispatch,isFetchedOption,allOptions])
  return (
       null
    );
}

export default GetAllOptions