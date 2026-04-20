import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { fetchLanguages } from '@/hook/slices/system/languageSlice/LanguageThunk'
import { AppDispatch, RootState } from '@/hook/store/store'
import { fetchPlugins } from '@/hook/slices/system/pluginSlice/PluginThunk'

const GetAllPlugin = () => {
    const dispatch = useDispatch<AppDispatch>();

  const {isFetchedPlugin,allPlugin}= useSelector((state:RootState)=>state.plugin)
   

  const isAPi= useRef(false)
   useEffect(() => {
    if(!isFetchedPlugin && !isAPi.current){
        dispatch(fetchPlugins());
        isAPi.current=true
    }else{
        isAPi.current=false
    }
   }, [dispatch,isFetchedPlugin,allPlugin])
  return (
       null
    );
}

export default GetAllPlugin