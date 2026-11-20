const {defineConfig,devices} = require('@playwright/test');

module.exports = defineConfig({
  testDir:'./browser-test',
  fullyParallel:false,
  workers:1,
  timeout:30000,
  use:{baseURL:'http://127.0.0.1:43812',trace:'retain-on-failure'},
  webServer:{
    command:'node ../scripts/demo-server.cjs',
    url:'http://127.0.0.1:43812/demonstracao/',
    env:{DEMO_PORT:'43812'},
    reuseExistingServer:false
  },
  projects:[
    {name:'chromium-desktop',use:{...devices['Desktop Chrome']}},
    {name:'edge-chromium',use:{...devices['Desktop Edge']}},
    {name:'firefox-desktop',use:{...devices['Desktop Firefox']}},
    {name:'webkit-desktop',use:{...devices['Desktop Safari']}},
    {name:'android',use:{...devices['Pixel 7']}},
    {name:'iphone',use:{...devices['iPhone 13']}},
    {name:'tablet',use:{...devices['iPad Mini']}}
  ]
});
