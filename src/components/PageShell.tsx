import Navbar from './Navbar'
import Footer from './Footer'
import type { ReactNode } from 'react'

export default function PageShell({ children }: { children: ReactNode }) { return <><Navbar/>{children}<Footer/></> }
