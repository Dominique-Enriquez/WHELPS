import { chromium } from 'playwright-core'
import fs from 'node:fs'

const base='http://localhost:3000'
const executablePath='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const widths=[320,375,390,430,640,768,820,1024,1280,1440,1920]
const results=[]
const adminEmail=process.env.WHELPS_QA_ADMIN_EMAIL
const adminPassword=process.env.WHELPS_QA_ADMIN_PASSWORD
const userEmail=process.env.WHELPS_QA_USER_EMAIL
const userPassword=process.env.WHELPS_QA_USER_PASSWORD
if(!adminEmail||!adminPassword||!userEmail||!userPassword)throw new Error('Set WHELPS_QA_ADMIN_EMAIL, WHELPS_QA_ADMIN_PASSWORD, WHELPS_QA_USER_EMAIL, and WHELPS_QA_USER_PASSWORD before running this check.')
fs.mkdirSync('.data/qa-responsive',{recursive:true})

const browser=await chromium.launch({headless:true,executablePath})
async function login(context,email,password){const response=await context.request.post(base+'/api/auth/login',{data:{email,password}});if(!response.ok())throw new Error(`Login failed for ${email}: ${response.status()}`)}
async function inspect(context,path,width,label){const page=await context.newPage();await page.setViewportSize({width,height:900});await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.waitForTimeout(120);const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,title:document.title,h1:document.querySelector('h1')?.textContent?.trim()||''}));results.push({label,path,width,...metrics,overflow:metrics.scrollWidth>metrics.clientWidth+1});if([320,768,1440].includes(width))await page.screenshot({path:`.data/qa-responsive/${label}-${width}.png`,fullPage:true});await page.close()}

const publicContext=await browser.newContext()
for(const width of widths){await inspect(publicContext,'/',width,'home');await inspect(publicContext,'/pets',width,'pets');await inspect(publicContext,'/donate',width,'donate');await inspect(publicContext,'/login',width,'login')}
await publicContext.close()

const adminContext=await browser.newContext()
await login(adminContext,adminEmail,adminPassword)
for(const width of widths){for(const path of ['/admin/dashboard','/admin/applications','/admin/messages','/admin/pets','/admin/adopted-pets','/admin/evaluation','/admin/settings','/admin/profile'])await inspect(adminContext,path,width,'admin-'+path.split('/').pop())}
const adminMobile=await adminContext.newPage();await adminMobile.setViewportSize({width:320,height:800});await adminMobile.goto(base+'/admin/dashboard',{waitUntil:'domcontentloaded'});const menu=adminMobile.getByRole('button',{name:'Open administrator navigation'});await menu.click();const drawerVisible=await adminMobile.getByRole('dialog',{name:'Administrator navigation'}).isVisible();await adminMobile.keyboard.press('Escape');const drawerClosed=!(await adminMobile.getByRole('dialog',{name:'Administrator navigation'}).isVisible().catch(()=>false));results.push({label:'admin-drawer',width:320,drawerVisible,drawerClosed,overflow:false});await adminMobile.close();await adminContext.close()

const userContext=await browser.newContext()
await login(userContext,userEmail,userPassword)
for(const width of widths)await inspect(userContext,'/dashboard',width,'user-dashboard')
const userMobile=await userContext.newPage();await userMobile.setViewportSize({width:320,height:800});await userMobile.goto(base+'/dashboard',{waitUntil:'domcontentloaded'});const userMenu=userMobile.getByRole('button',{name:'Open user navigation'});await userMenu.click();const userDrawerVisible=(await userMenu.getAttribute('aria-expanded'))==='true';await userMobile.keyboard.press('Escape');const userDrawerClosed=(await userMenu.getAttribute('aria-expanded'))==='false';results.push({label:'user-drawer',width:320,drawerVisible:userDrawerVisible,drawerClosed:userDrawerClosed,overflow:false});await userMobile.close();await userContext.close()

await browser.close()
const failures=results.filter(x=>x.overflow||x.drawerVisible===false||x.drawerClosed===false)
console.log(JSON.stringify({checks:results.length,failures,results},null,2))
if(failures.length)process.exitCode=1
