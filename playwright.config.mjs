import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',
 use:{baseURL:process.env.DICTIONARY_BASE_URL || 'http://127.0.0.1:3000',headless:true},
 webServer:process.env.DICTIONARY_BASE_URL ? undefined : {command:'python scripts/serve.py',url:'http://127.0.0.1:3000',reuseExistingServer:!process.env.CI},
 projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'webkit',use:{browserName:'webkit'}}],
 reporter:[['list'],['html',{open:'never'}]],
});
