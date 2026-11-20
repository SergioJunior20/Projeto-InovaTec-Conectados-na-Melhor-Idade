const {test,expect} = require('@playwright/test');

async function openNav(page) {
  const menu = page.getByRole('button',{name:'Menu',exact:true});
  if (await menu.isVisible()) await menu.click();
}

test('a demonstracao funciona em subpasta e a Aurora orienta no aparelho',async ({page})=>{
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/demonstracao/');
  await expect(page.locator('#demo-notice')).toBeVisible();
  await openNav(page);
  await page.getByRole('navigation').getByRole('link',{name:'Aurora IA'}).click();
  await page.getByRole('textbox',{name:'Sua pergunta'}).fill('ligar a lanterna');
  await page.getByRole('button',{name:'Perguntar',exact:true}).click();
  await expect(page.getByRole('log')).toContainText('No Android');
  await page.getByRole('textbox',{name:'Sua pergunta'}).fill('E no iPhone?');
  await page.getByRole('button',{name:'Perguntar',exact:true}).click();
  await expect(page.locator('#conversation .tutor-entry').last()).toContainText('Central de Controle');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  expect(errors).toEqual([]);
});

test.describe('funcionamento offline',()=>{
  test.skip(({browserName})=>browserName!=='chromium','Validação offline no Chromium.');
  test('aprendizagem opcional registra repeticao, pode ser apagada e o guia abre offline',async ({page,context})=>{
  await page.goto('/demonstracao/#aurora');
  await page.getByRole('checkbox',{name:/Lembrar os assuntos/}).check();
  for (const question of ['Como ligar a lanterna?','Como posso acender a lanterna?']) {
    await page.getByRole('textbox',{name:'Sua pergunta'}).fill(question);
    await page.getByRole('button',{name:'Perguntar',exact:true}).click();
  }
  await expect(page.locator('#aurora-recommendation')).toContainText('Lanterna do celular');
  await page.getByRole('checkbox',{name:/Lembrar os assuntos/}).uncheck();
  await expect(page.locator('#aurora-recommendation')).toBeEmpty();
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Aurora IA',exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Sua pergunta'}).fill('Como mandar um e-mail?');
  await page.getByRole('button',{name:'Perguntar',exact:true}).click();
  await expect(page.getByRole('log')).toContainText('Escrever');
  });
});

test('menu e texto ampliado permanecem acessíveis em 320 px',async ({page})=>{
  await page.setViewportSize({width:320,height:800});
  await page.goto('/demonstracao/#aurora');
  await page.getByRole('button',{name:'Acessibilidade',exact:true}).click();
  await page.locator('#font-size').press('End');
  await expect(page.locator('#font-percent')).toHaveText('200%');
  const overflow = await page.evaluate(()=>{
    if (document.documentElement.scrollWidth<=window.innerWidth+1) return [];
    return [...document.querySelectorAll('body *')].flatMap(element=>{
      const box = element.getBoundingClientRect();
      return box.right>window.innerWidth+1 && box.width>0
        ? [element.tagName+'#'+element.id+'.'+element.className+' '+Math.round(box.right)] : [];
    });
  });
  expect(overflow).toEqual([]);
  await openNav(page);
  await page.getByRole('navigation').getByRole('link',{name:'Aulas e biblioteca'}).click();
  await expect(page.getByRole('heading',{name:'Aulas e biblioteca'})).toBeVisible();
});
