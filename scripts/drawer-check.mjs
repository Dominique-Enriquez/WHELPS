import { chromium } from 'playwright-core'

const userEmail=process.env.WHELPS_QA_USER_EMAIL
const userPassword=process.env.WHELPS_QA_USER_PASSWORD
if(!userEmail||!userPassword)throw new Error('Set WHELPS_QA_USER_EMAIL and WHELPS_QA_USER_PASSWORD before running this check.')

const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'})
const context=await browser.newContext()
let response=await context.request.post('http://localhost:3000/api/auth/login',{data:{email:userEmail,password:userPassword}})
if(!response.ok())throw new Error(`Login failed: ${response.status()}`)
const page=await context.newPage()
await page.setViewportSize({width:320,height:800})
await page.goto('http://localhost:3000/dashboard',{waitUntil:'domcontentloaded'})
const menu=page.getByRole('button',{name:'Open user navigation'})
await menu.click()
const opened=(await menu.getAttribute('aria-expanded'))==='true'
await page.keyboard.press('Escape')
const closed=(await menu.getAttribute('aria-expanded'))==='false'
console.log(JSON.stringify({opened,closed}))
await browser.close()
if(!opened||!closed)process.exitCode=1
