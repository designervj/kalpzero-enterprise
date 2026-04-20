import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { fetchLanguages } from '@/hook/slices/system/languageSlice/LanguageThunk'
import { AppDispatch, RootState } from '@/hook/store/store'

const GetAllLanguage = () => {
  const {allLanguage,isFetchedLanguage}= useSelector((state:RootState)=>state.language)
    const dispatch= useDispatch<AppDispatch>()
   
     const isAPi= useRef(false)
     console.log("isAPi",isAPi.current)
    useEffect(() => {
        if(!isFetchedLanguage && !isAPi.current){
            dispatch(fetchLanguages())
            isAPi.current=true
        }else{
            isAPi.current=false
        }
    }, [isFetchedLanguage])
  return (
   null
  )
}

export default GetAllLanguage