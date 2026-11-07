import {chromium} from 'playwright';
import config from '../src/config.js';
import {key, legacyKey} from '../src/storage.js';
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),cases=[config];
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
fs.mkdirSync(path.join(root,'.qa'),{recursive:true});
const results=[];
async function check(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(e){results.push({name,passed:false,error:e.message});console.log('FAIL',name,e.message.slice(0,230));}}
const servers=[];
try{for(const [i,c] of cases.entries()){
 const dir=root,port=Number(process.env.TEST_PORT||8181)+i,base='http://127.0.0.1:'+port;
 const server=spawn(process.execPath,[path.join(dir,'preview.mjs')],{cwd:dir,env:{...process.env,PORT:String(port)},stdio:'ignore',windowsHide:true});servers.push(server);
 for(let k=0;k<50;k++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(base);await page.locator('h1').waitFor();
 await page.screenshot({path:path.join(dir,'evidence/first.png'),fullPage:true});
 await check(c.slug+' empty and fictional demo',async()=>{assert.equal(await page.locator('.task').count(),0);await page.getByRole('button',{name:/демопример|fictional demo/}).click();await page.locator('.task').first().waitFor();assert.ok(await page.locator('.task').count()>=3);});
 await check(c.slug+' persistence after reload',async()=>{const n=await page.locator('.task').count();await page.reload();await page.locator('.task').first().waitFor();assert.equal(await page.locator('.task').count(),n);});
 if(c.mode==='objects'){
  await check(c.slug+' create employee and object',async()=>{for(const [button,name]of [['Сотрудники','Сотрудник Тест'],['Объекты','Объект Тест']]){await page.getByRole('button',{name:button,exact:true}).click();await page.getByRole('dialog').getByLabel('Название').fill(name);await page.getByRole('dialog').getByRole('button',{name:'Добавить',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Закрыть',exact:true}).click();}});
  await check(c.slug+' assignment and duplicate rejected',async()=>{await page.getByRole('button',{name:'+ Назначить',exact:true}).click();await page.getByLabel('Сотрудник',{exact:true}).selectOption({label:'Сотрудник Тест'});await page.getByLabel('Объект',{exact:true}).selectOption({label:'Объект Тест'});await page.getByRole('dialog').getByRole('button',{name:'Сохранить'}).click();assert.equal(await page.getByRole('dialog').count(),0);await page.getByRole('button',{name:'+ Назначить',exact:true}).click();await page.getByLabel('Сотрудник',{exact:true}).selectOption({label:'Сотрудник Тест'});await page.getByRole('dialog').getByRole('button',{name:'Сохранить'}).click();assert.match(await page.getByRole('dialog').textContent(),/уже назначен/);await page.getByRole('button',{name:'Отмена',exact:true}).click();});
  await check(c.slug+' weekly plan',async()=>{await page.getByRole('button',{name:'Неделя',exact:true}).click();assert.equal(await page.locator('thead th').count(),8);assert.equal(await page.locator('.week-assignment').count(),4);await page.getByRole('button',{name:'План на день',exact:true}).click();});
  await check(c.slug+' deletion of assigned directory blocked',async()=>{await page.getByRole('button',{name:'Сотрудники',exact:true}).click();await page.locator('.directory li').first().getByRole('button',{name:'Удалить'}).click();assert.match(await page.getByRole('dialog').textContent(),/используется/);await page.getByRole('button',{name:'Закрыть',exact:true}).click();});
 }else{
  const en=c.mode==='tasks',add=en?'+ New task':'+ Новая задача',save=en?'Save':'Сохранить';
  await check(c.slug+' create, trim and safe text',async()=>{await page.getByRole('button',{name:add,exact:true}).click();await page.getByRole('dialog').getByLabel(en?'Title':'Название',{exact:true}).fill('  <img src=x onerror=alert(1)>  ');await page.getByRole('dialog').getByLabel(en?'Description':'Описание',{exact:true}).fill('Unique description alpha');if(en)await page.getByLabel('Tags, separated by commas').fill('NewTag, Study');await page.getByRole('dialog').getByRole('button',{name:save,exact:true}).click();assert.equal(await page.locator('.task img').count(),0);assert.ok(await page.getByRole('heading',{name:'<img src=x onerror=alert(1)>',exact:true}).count());});
  await check(c.slug+' description search',async()=>{await page.getByPlaceholder(en?'Search descriptions':'Название или описание').fill('Unique description');assert.equal(await page.locator('.task').count(),1);await page.getByPlaceholder(en?'Search descriptions':'Название или описание').fill('');});
  await check(c.slug+' status, edit and remove',async()=>{const card=page.locator('.task').filter({has:page.getByRole('heading',{name:'<img src=x onerror=alert(1)>',exact:true})});await card.getByRole('combobox').selectOption('done');await card.getByRole('button',{name:/Edit:|Редактировать:/}).click();await page.getByRole('dialog').getByLabel(en?'Title':'Название',{exact:true}).fill('Edited task');await page.getByRole('dialog').getByRole('button',{name:save,exact:true}).click();const updated=page.locator('.task').filter({has:page.getByRole('heading',{name:'Edited task',exact:true})});await updated.getByRole('button',{name:/Delete:|Удалить:/}).click();assert.equal(await page.getByRole('heading',{name:'Edited task',exact:true}).count(),0);});
  if(en){await check(c.slug+' tags, manual order, modified sort and deadline',async()=>{await page.getByRole('button',{name:'Manage tags',exact:true}).click();await page.getByRole('dialog').getByLabel('Name',{exact:true}).fill('Urgent');await page.getByRole('dialog').getByRole('button',{name:'Add',exact:true}).click();await page.getByRole('button',{name:'Close',exact:true}).click();await page.getByLabel('Tag',{exact:true}).selectOption('Urgent');assert.equal(await page.locator('.task').count(),0);await page.getByLabel('Tag',{exact:true}).selectOption('all');const first=await page.locator('.task h3').first().textContent();await page.locator('.task').nth(1).getByRole('button',{name:/Move up:/}).click();assert.notEqual(await page.locator('.task h3').first().textContent(),first);await page.getByLabel('Sort',{exact:true}).selectOption('updated');assert.ok(await page.locator('time').count());});}
  else await check(c.slug+' kanban drag onto occupied column',async()=>{const title=await page.locator('.column').nth(0).locator('.task h3').first().textContent();await page.locator('.column').nth(0).locator('.task').first().dragTo(page.locator('.column').nth(1).locator('.task').first());await page.waitForTimeout(150);assert.ok(await page.locator('.column').nth(1).getByRole('heading',{name:title,exact:true}).count());});
 }
 await check(c.slug+' CSV and JSON backup',async()=>{const csvEvent=page.waitForEvent('download');await page.getByRole('button',{name:'CSV',exact:true}).click();assert.ok((await csvEvent).suggestedFilename().endsWith('.csv'));const jsonEvent=page.waitForEvent('download');await page.getByRole('button',{name:/Копия JSON|Backup JSON/,exact:true}).click();assert.ok((await jsonEvent).suggestedFilename().endsWith('.json'));const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)), key);await page.locator('input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({tracker:key,version:1,data:saved.data}))});await page.waitForTimeout(100);assert.equal((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).data.tasks.length,saved.data.tasks.length);});
 await check(c.slug+' bad backup preserves data',async()=>{await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').textContent(),/Неверный формат|Invalid format/);});
 await check(c.slug+' no console errors',async()=>assert.deepEqual(errors,[]));
 await page.getByRole('button',{name:/Закрыть сообщение|Dismiss message/}).click().catch(()=>{});
 for(const width of [390,768,1440])await check(c.slug+' viewport '+width,async()=>{await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));if(width===390){await page.getByRole('button',{name:/^Меню|^Menu/}).click();assert.equal(await page.locator('.sidebar.open').count(),1);await page.getByRole('button',{name:/Закрыть меню|Close menu/}).click();await page.screenshot({path:path.join(dir,'evidence/mobile.png'),fullPage:true});}});
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:path.join(dir,'evidence/final.png'),fullPage:true});
 await check(c.slug+' keyboard dialog and Escape',async()=>{await page.getByRole('button',{name:c.mode==='objects'?'+ Назначить':c.mode==='tasks'?'+ New task':'+ Новая задача',exact:true}).focus();await page.keyboard.press('Enter');await page.getByRole('dialog').waitFor();assert.ok(await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)));await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);});
 await check(c.slug+' tab conflict preserves draft',async()=>{await page.locator('.task').first().getByRole('button',{name:/Edit:|Редактировать:/}).click();const field=c.mode==='objects'?page.getByRole('dialog').getByLabel('Примечание',{exact:true}):page.getByRole('dialog').getByLabel(c.mode==='tasks'?'Title':'Название',{exact:true});await field.fill('Unsaved draft');await page.evaluate(key=>{const old=JSON.parse(localStorage.getItem(key));old.revision++;localStorage.setItem(key,JSON.stringify(old));},key);await page.getByRole('dialog').getByRole('button',{name:c.mode==='tasks'?'Save':'Сохранить',exact:true}).click();assert.match(await page.getByRole('dialog').textContent(),/Конфликт|conflict/);assert.equal(await field.inputValue(),'Unsaved draft');await page.keyboard.press('Escape');await page.reload();await page.locator('.task').first().waitFor();});
 await check(c.slug+' storage quota preserves draft',async()=>{await page.locator('.task').first().getByRole('button',{name:/Edit:|Редактировать:/}).click();await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError');};});await page.getByRole('dialog').getByRole('button',{name:c.mode==='tasks'?'Save':'Сохранить',exact:true}).click();assert.match(await page.getByRole('dialog').textContent(),/Не удалось сохранить|Cannot save/);assert.equal(await page.getByRole('dialog').count(),1);await page.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);await page.keyboard.press('Escape');});
 await check(c.slug+' previous release browser data remains editable',async()=>{
   const oldStorage = await page.evaluate(({key, legacyKey})=>{
     const saved=localStorage.getItem(key);
     localStorage.removeItem(key);
     localStorage.setItem(legacyKey,saved);
     return JSON.parse(saved);
   },{key,legacyKey});
   await page.reload();
   await page.locator('.task').first().waitFor();
   const newBackup = {tracker:key,version:1,data:oldStorage.data};
   const backupFile = tracker => ({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...newBackup,tracker}))});
   await page.locator('input[type=file]').setInputFiles(backupFile(legacyKey));
   await page.waitForFunction(({legacyKey,revision})=>JSON.parse(localStorage.getItem(legacyKey)).revision===revision+1,{legacyKey,revision:oldStorage.revision});
   await page.evaluate(({key,legacyKey})=>{
     localStorage.setItem(key,localStorage.getItem(legacyKey));
     localStorage.removeItem(legacyKey);
   },{key,legacyKey});
   await page.reload();
   await page.locator('.task').first().waitFor();
   await page.locator('input[type=file]').setInputFiles(backupFile(legacyKey));
   await page.waitForFunction(({key,revision})=>JSON.parse(localStorage.getItem(key)).revision===revision+2,{key,revision:oldStorage.revision});
 });
 await check(c.slug+' damaged storage not overwritten',async()=>{await page.evaluate(key=>localStorage.setItem(key,'{invalid'),key);await page.reload();await page.getByRole('alert').first().waitFor();assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'{invalid');});
 await context.close();
 }}finally{await browser.close();for(const s of servers)s.kill();fs.writeFileSync(path.join(root,'.qa/browser-results.json'),JSON.stringify({total:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,results},null,2));}
if(results.some(x=>!x.passed))process.exitCode=1;
