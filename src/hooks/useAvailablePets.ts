import { useCallback, useEffect, useState } from 'react'

const normalize=pet=>({...pet,fixed:pet.fixedStatus,ageGroup:/month|week|day/i.test(pet.age)?'Young':'Adult'})

export function useAvailablePets(){
  const [pets,setPets]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
  const load=useCallback(async (signal?: AbortSignal)=>{
    setLoading(true);setError('')
    try{
      const response=await fetch('/api/pets',{signal})
      const data=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(data.error||'Available pets could not be loaded.')
      setPets((data.pets||[]).map(normalize))
    }catch(err){if(err.name!=='AbortError')setError(err.message)}finally{if(!signal?.aborted)setLoading(false)}
  },[])
  useEffect(()=>{const controller=new AbortController();load(controller.signal);return()=>controller.abort()},[load])
  return {pets,loading,error,reload:()=>load()}
}
