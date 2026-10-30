import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsModule } from './lib/load-ts-module.mjs';
const types = await loadTsModule(new URL('../src/app/admin/play-analytics-types.ts', import.meta.url));
const metrics = await loadTsModule(new URL('../src/app/admin/dashboard-metrics.ts', import.meta.url), { './play-analytics-types': types });
const { default: Commerce } = await loadTsModule(new URL('../src/app/admin/player-commerce.tsx', import.meta.url), { './admin.module.css': {}, './dashboard-metrics': metrics }, { allowNodeModules: true });
const render = (value) => renderToStaticMarkup(createElement(Commerce, { value }));
assert.match(render(undefined), /無法確認餘額/);
assert.match(render(null), /尚未建立商店資產/);
const html = render({ initialized: true, gold: 100, diamonds: 0, equipped_emotes: ['taunt_tea'],
  owned_emotes: [{ id: 'taunt_tea', text: '<script>test</script>', request_id: 'unlock-uuid', acquired_at: '2026-10-19T00:00:00Z' }],
  transactions: [{ request_id: 'purchase-uuid', action: 'buy_emote', item_id: 'taunt_tea', item_text: '台詞', terminal_error: 'cosmetics_no_diamonds',
    created_at: '2026-10-19T00:00:00Z', gold_before: 100, gold_after: 100, diamonds_before: 20, diamonds_after: 20, price: 30 }] });
for (const value of ['鑽石 0', '使用中', 'purchase-uuid', 'unlock-uuid', 'cosmetics_no_diamonds', '20 → 20', '最近 50 筆', '&lt;script&gt;']) assert.ok(html.includes(value), value);
assert.ok(!html.includes('<script>test</script>'));
console.log('player-commerce: legacy, cold account, zero balance, ownership, receipt and escaping passed');
