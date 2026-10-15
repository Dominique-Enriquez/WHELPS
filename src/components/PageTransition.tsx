import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'

const EXIT_DURATION=145
const ENTER_DURATION=165

type TransitionPhase = 'visible' | 'exiting' | 'pre-enter' | 'entering'
type ScrollPosition = {left: number; top: number}

export default function PageTransition({children,routeKey}: {children: ReactNode; routeKey: string}){
  const router=useRouter()
  const [displayed,setDisplayed]=useState({key:routeKey,content:children})
  const [phase,setPhase]=useState<TransitionPhase>('visible')
  const [minimumHeight,setMinimumHeight]=useState<number | null>(null)
  const wrapperRef=useRef<HTMLDivElement>(null),nextRef=useRef({key:routeKey,content:children}),currentKeyRef=useRef(routeKey)
  const currentHistoryKeyRef=useRef<string | null>(null),exitStartedRef=useRef(0),historyNavigationRef=useRef(false),capturedScrollRef=useRef(false),reduceMotionRef=useRef(false)
  const scrollPositionsRef=useRef(new Map<string, ScrollPosition>()),knownHistoryKeysRef=useRef(new Set<string>()),targetScrollRef=useRef<ScrollPosition>({left:0,top:0}),swapTimerRef=useRef<ReturnType<typeof setTimeout> | undefined>(undefined),settleTimerRef=useRef<ReturnType<typeof setTimeout> | undefined>(undefined),frameRef=useRef<number[]>([])
  nextRef.current={key:routeKey,content:children}

  const clearScheduled=()=>{
    clearTimeout(swapTimerRef.current)
    clearTimeout(settleTimerRef.current)
    frameRef.current.forEach(frame=>cancelAnimationFrame(frame))
    frameRef.current=[]
  }

  const showIncoming=(destinationKey: string)=>{
    const incoming={key:destinationKey,content:nextRef.current.content}
    const reduced=reduceMotionRef.current
    const elapsed=exitStartedRef.current?performance.now()-exitStartedRef.current:EXIT_DURATION
    const wait=reduced?0:Math.max(0,EXIT_DURATION-elapsed)
    swapTimerRef.current=setTimeout(()=>{
      const destinationHistoryKey=window.history.state?.key||destinationKey
      const returningToHistoryEntry=historyNavigationRef.current||knownHistoryKeysRef.current.has(destinationHistoryKey)
      let storedPosition: ScrollPosition | null=null
      try{storedPosition=JSON.parse(sessionStorage.getItem(`whelps-scroll:${destinationKey}`))}catch{}
      const savedPosition=scrollPositionsRef.current.get(destinationHistoryKey)||(returningToHistoryEntry?(scrollPositionsRef.current.get(destinationKey)||storedPosition):null)
      targetScrollRef.current=savedPosition||{left:0,top:0}
      historyNavigationRef.current=false
      knownHistoryKeysRef.current.add(destinationHistoryKey)
      setDisplayed(incoming)
      currentKeyRef.current=destinationKey
      currentHistoryKeyRef.current=destinationHistoryKey
      window.scrollTo({...targetScrollRef.current,behavior:'instant'})
      if(reduced){setPhase('visible');setMinimumHeight(null);requestAnimationFrame(()=>window.scrollTo({...targetScrollRef.current,behavior:'instant'}));return}
      setPhase('pre-enter')
      const firstFrame=requestAnimationFrame(()=>{
        const secondFrame=requestAnimationFrame(()=>{
          setPhase('entering')
          settleTimerRef.current=setTimeout(()=>{window.scrollTo({...targetScrollRef.current,behavior:'instant'});setPhase('visible');setMinimumHeight(null)},ENTER_DURATION)
        })
        frameRef.current.push(secondFrame)
      })
      frameRef.current.push(firstFrame)
    },wait)
  }

  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync=()=>{reduceMotionRef.current=media.matches}
    sync()
    media.addEventListener?.('change',sync)
    return()=>media.removeEventListener?.('change',sync)
  },[])

  useEffect(()=>{
    currentHistoryKeyRef.current=window.history.state?.key||routeKey
    knownHistoryKeysRef.current.add(currentHistoryKeyRef.current)
    const handleStart=()=>{
      clearScheduled()
      if(!capturedScrollRef.current){const position={left:window.scrollX,top:window.scrollY};scrollPositionsRef.current.set(currentHistoryKeyRef.current,position);scrollPositionsRef.current.set(currentKeyRef.current,position);sessionStorage.setItem(`whelps-scroll:${currentKeyRef.current}`,JSON.stringify(position))}
      capturedScrollRef.current=false
      if(reduceMotionRef.current)return
      setMinimumHeight(Math.max(wrapperRef.current?.offsetHeight||0,window.innerHeight))
      exitStartedRef.current=performance.now()
      setPhase('exiting')
    }
    const handleError=()=>{
      clearScheduled()
      setPhase('visible')
      setMinimumHeight(null)
    }
    const handleComplete=(url: string)=>{
      const destinationKey=String(url).split('#')[0]
      const frame=requestAnimationFrame(()=>showIncoming(destinationKey))
      frameRef.current.push(frame)
    }
    const captureLinkScroll=(event: MouseEvent)=>{
      const link=(event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if(!link||event.defaultPrevented||event.button!==0)return
      const destination=new URL(link.href,window.location.href)
      if(destination.origin!==window.location.origin||`${destination.pathname}${destination.search}`===currentKeyRef.current)return
      const position={left:window.scrollX,top:window.scrollY}
      scrollPositionsRef.current.set(currentHistoryKeyRef.current,position)
      scrollPositionsRef.current.set(currentKeyRef.current,position)
      sessionStorage.setItem(`whelps-scroll:${currentKeyRef.current}`,JSON.stringify(position))
      capturedScrollRef.current=true
    }
    const markHistoryNavigation=()=>{historyNavigationRef.current=true}
    window.addEventListener('popstate',markHistoryNavigation)
    document.addEventListener('click',captureLinkScroll,true)
    router.events.on('routeChangeStart',handleStart)
    router.events.on('routeChangeComplete',handleComplete)
    router.events.on('routeChangeError',handleError)
    return()=>{
      clearScheduled()
      window.removeEventListener('popstate',markHistoryNavigation)
      document.removeEventListener('click',captureLinkScroll,true)
      router.events.off('routeChangeStart',handleStart)
      router.events.off('routeChangeComplete',handleComplete)
      router.events.off('routeChangeError',handleError)
    }
  },[])

  return <div ref={wrapperRef} className={`page-transition page-transition--${phase}`} style={minimumHeight?{minHeight:`${minimumHeight}px`}:undefined} aria-busy={phase!=='visible'}>{displayed.content}</div>
}
