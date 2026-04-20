import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { fetchLanguages } from '@/hook/slices/system/languageSlice/LanguageThunk'
import { AppDispatch, RootState } from '@/hook/store/store'
import { fetchThemes } from '@/hook/slices/system/themeSlice/ThemeThunk'


const GetAllTheme = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isFetchedTheme, allThemes } = useSelector((state: RootState) => state.theme);
   const isApi= useRef(false)
    useEffect(() => {
      if(!isFetchedTheme && !isApi.current){
        dispatch(fetchThemes());
        isApi.current=true
      }else{
        isApi.current=false
      }
    }, [dispatch,isFetchedTheme,allThemes]);

 

    return (
     null
    );
}

export default GetAllTheme