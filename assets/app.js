/* 多页版：核心盟约 / 附加盟约 / 干员图鉴 / 机制速记 / 干员详情 / 盟约详情 */
(function(){
"use strict";

const DATA = window.DATA;
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(text !== undefined) n.textContent = text;
  return n;
};

const TIER_COLOR = {1:"#9fb0b0",2:"#e6eef0",3:"#25c39a",4:"#2eb6ff",5:"#ffc23d",6:"#ff8a3d"};
const TIER_LABEL = {1:"Ⅰ",2:"Ⅱ",3:"Ⅲ",4:"Ⅳ",5:"Ⅴ",6:"Ⅵ"};
const PAGE_SIZE = 60;

/* 兼容旧单文件版的 #/op/<name> 与 #/cov/<name> 深链 */
(function(){
  const m = /^#\/(op|cov)\/(.+)$/.exec(location.hash);
  if(!m) return;
  location.replace((m[1] === "op" ? "op.html" : "cov.html") + "?name=" + m[2]);
})();

const PAGE = document.body.dataset.page;
const QS = new URLSearchParams(location.search);

const opHref  = (name) => "op.html?name=" + encodeURIComponent(name);
const covHref = (name) => "cov.html?name=" + encodeURIComponent(name);
const goOp  = (name) => { location.href = opHref(name); };
const goCov = (name) => { location.href = covHref(name); };

function goBack(fallback){
  const ref = document.referrer || "";
  if(history.length > 1 && ref && ref.indexOf(location.origin) === 0) history.back();
  else location.href = fallback;
}

/* 文本高亮：数字 / 【盟约】 / <时机> */
function frag(text){
  const f = document.createDocumentFragment();
  const re = /(【[^】]+】|<[^>]+>|\d+(?:\.\d+)?%?)/g;
  let last = 0, m;
  while((m = re.exec(text))){
    if(m.index > last) f.append(text.slice(last, m.index));
    const s = document.createElement("span");
    s.textContent = m[0];
    s.className = m[0][0] === "【" ? "bond" : m[0][0] === "<" ? "phase" : "num";
    f.append(s);
    last = re.lastIndex;
  }
  f.append(text.slice(last));
  return f;
}

/* ---------- 头像 ---------- */
function avBox(o, extra){
  const a = el("span", "av" + (extra ? " " + extra : ""));
  if(o.img){
    const im = el("img");
    im.src = o.img; im.alt = ""; im.loading = "lazy"; im.decoding = "async";
    a.append(im);
  } else {
    a.append(el("span", "fb", (o.name || "?").slice(0, 1)));
  }
  if(o.tier){
    const t = el("b", "avt", TIER_LABEL[o.tier] || "?");
    t.style.color = TIER_COLOR[o.tier] || "#9fb0b0";
    a.append(t);
  }
  return a;
}

/* ---------- 盟约卡片 ---------- */
function covFx(c){
  const f = document.createDocumentFragment();
  const fx = c.effects || [];
  if(fx.length){
    const p = el("p", "eff"); p.append(frag(fx[0].text)); f.append(p);
  }
  for(const b of fx.slice(1)){
    const row = el("div", "bonus");
    row.append(el("span", "lab", b.label));
    const p = el("p"); p.append(frag(b.text));
    row.append(p); f.append(row);
  }
  if(c.note) f.append(el("p", "note", c.note));
  return f;
}

function covCard(c, opts){
  opts = opts || {};
  const card = el("article", "cov " + (c.core ? "core" : "extra"));
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", c.name + " · 查看盟约详情");
  card.onclick = () => goCov(c.name);
  card.onkeydown = (e) => {
    if(e.key === "Enter" || e.key === " "){ e.preventDefault(); goCov(c.name); }
  };
  const head = el("div", "cov-head");
  head.append(el("h3", null, c.name), el("span", "act", "激活 " + c.activation + " 人"));
  card.append(head, covFx(c));

  if(c.members && c.members.length){
    const mem = el("div", "members");
    mem.append(el("span", "mlabel", "所属"));
    for(const m of c.members){
      const chip = el("span", "chip");
      const op = DATA.operators.find(x => x.name === m.name);
      if(op && op.img){
        const im = el("img", "cav");
        im.src = op.img; im.alt = ""; im.loading = "lazy"; im.decoding = "async";
        chip.append(im);
      }
      chip.append(document.createTextNode(m.name));
      chip.style.color = TIER_COLOR[m.tier] || "#9fb0b0";
      chip.title = (TIER_LABEL[m.tier] || "?") + " 阶 · 查看干员详情";
      if(opts.self && m.name === opts.self) chip.classList.add("self");
      chip.onclick = (e) => { e.stopPropagation(); goOp(m.name); };
      mem.append(chip);
    }
    card.append(mem);
    if(opts.detail){
      const n = c.members.length;
      const st = el("p", "covstat");
      if(c.core){
        st.append(document.createTextNode("本盟约共 "), el("b", null, String(n)), document.createTextNode(" 名干员 · 6 人强化："));
        st.append(document.createTextNode(n >= 6 ? "已满足" : "还差 " + (6 - n) + " 名不同干员"));
      } else {
        st.append(document.createTextNode("本盟约共 "), el("b", null, String(n)), document.createTextNode(" 名可激活干员"));
      }
      card.append(st);
    }
  }
  return card;
}

/* ---------- 干员行 ---------- */
function opRow(o){
  const row = el("div", "op");
  row.tabIndex = 0;
  row.setAttribute("role", "link");
  row.setAttribute("aria-label", o.name + " · 查看详情");
  row.onclick = () => goOp(o.name);
  row.onkeydown = (e) => {
    if(e.key === "Enter" || e.key === " "){ e.preventDefault(); goOp(o.name); }
  };

  const nameBox = el("div", "opname");
  nameBox.append(el("span", "nm", o.name));
  if(o.proto) nameBox.append(el("span", "proto", "原型 · " + o.proto));

  const tags = el("div", "covtags");
  for(const cov of o.covenants){
    const t = el("span", "tag", cov);
    t.title = "查看「" + cov + "」盟约详情";
    t.onclick = (e) => { e.stopPropagation(); goCov(cov); };
    tags.append(t);
  }

  const tr = el("p", "trait");
  tr.append(frag(o.trait));

  row.append(avBox(o, "opav"), nameBox, tags, tr);
  return row;
}

function noteCard(n, i){
  const card = el("div", "note-card");
  card.append(el("div", "idx", String(i + 1).padStart(2, "0")), el("h3", null, n.title));
  const p = el("p"); p.append(frag(n.text)); card.append(p);
  return card;
}

/* ---------- 干员详情 ---------- */
function traitBlock(label, text, elite, who){
  const d = el("div", "dblock");
  const lab = el("div", "dlabel");
  lab.append(el("span", "lv " + (elite ? "n2" : "n1"), label));
  const w = (who === undefined) ? (elite ? "精锐状态" : "普通状态") : who;
  if(w) lab.append(el("span", "who", w));
  d.append(lab);
  const p = el("p", "dtext"); p.append(frag(text)); d.append(p);
  return d;
}

function coreCovsOf(o){
  return o.covenants
    .map(n => DATA.covenants.find(c => c.name === n))
    .filter(c => c && c.core);
}

function lineupVariants(c, o){
  const pool = c.members.map(m => DATA.operators.find(x => x.name === m.name)).filter(Boolean);
  const self = pool.find(x => x.name === o.name) || o;
  const others = pool.filter(x => x.name !== self.name);
  const seen = new Set(), out = [];
  const push = (label, arr) => {
    const picked = arr.slice(0, 6);
    for(const x of others){
      if(picked.length >= 6) break;
      if(!picked.includes(x)) picked.push(x);
    }
    const key = picked.map(x => x.name).join("|");
    if(seen.has(key)) return;
    seen.add(key);
    out.push({ label, members: picked });
  };
  const low = others.slice().sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name, "zh"));
  const high = others.slice().sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name, "zh"));

  const cov = [self], used = new Set([self.tier]);
  for(const x of low){
    if(cov.length >= 6) break;
    if(!used.has(x.tier)){ cov.push(x); used.add(x.tier); }
  }
  push("覆盖全阶", cov);
  push("低阶优先", [self].concat(low));
  push("高阶优先", [self].concat(high));
  return out;
}

function lineupCard(c, o){
  const variants = lineupVariants(c, o);
  let idx = 0;
  const card = el("article", "dcard lineup");

  const head = el("div", "lh");
  head.append(el("h3", null, "【" + c.name + "】6 人强化"));
  const badge = el("span", "lbadge");
  head.append(badge);
  card.append(head);

  const note = el("p", "lnote");
  const buff = el("p", "lbuff");
  const chips = el("div", "lchips");
  const foot = el("div", "lfoot");
  const swap = el("button", "dbtn", "换一套");
  swap.type = "button";
  const label = el("span", "lvar");
  foot.append(swap, label);
  card.append(note, buff, chips, foot);

  const bonus = (c.effects || []).find(e => e.label.indexOf("6 名") >= 0 || e.label.indexOf("6名") >= 0);

  function paint(){
    const v = variants[idx], n = v.members.length;
    badge.textContent = n >= 6 ? "已选 6 / 6" : "仅 " + n + " 人可选";
    badge.classList.toggle("warn", n < 6);
    const tiers = [...new Set(v.members.map(x => x.tier))].sort();
    const tierText = tiers.length >= 6 ? "Ⅰ–Ⅵ 阶" : tiers.map(t => TIER_LABEL[t]).join(" · ") + " 阶";
    note.textContent = "本盟约共 " + c.members.length + " 名干员 · 覆盖 " + tierText;
    if(bonus){
      buff.style.display = "";
      buff.replaceChildren(el("b", null, "6 人强化"), document.createTextNode("："));
      buff.append(frag(bonus.text));
    } else {
      buff.style.display = "none";
    }
    chips.replaceChildren(...v.members.map(x => {
      const b = el("div", "lchip");
      b.append(avBox(x));
      const col = el("div");
      col.style.minWidth = "0";
      col.append(el("div", "ln", x.name), el("div", "lt", (TIER_LABEL[x.tier] || "?") + " 阶"));
      b.append(col);
      b.title = x.name + " · 查看详情";
      b.onclick = () => goOp(x.name);
      return b;
    }));
    label.textContent = "方案 " + (idx + 1) + " / " + variants.length + " · " + v.label;
    swap.disabled = variants.length < 2;
  }
  swap.onclick = () => { idx = (idx + 1) % variants.length; paint(); };
  paint();
  return card;
}

function renderLineup(o){
  const wrap = $("#dlineup");
  const cores = coreCovsOf(o);
  if(!cores.length){
    const d = el("article", "dcard");
    d.append(el("h3", null, "无核心盟约"));
    const p = el("p", "lnone");
    p.append(document.createTextNode("该干员只带附加盟约（"));
    p.append(el("b", null, o.covenants.join("、")));
    p.append(document.createTextNode("），不参与核心盟约的 6 人强化；附加盟约按激活人数直接生效。"));
    d.append(p);
    d.append(el("p", "lnote", "若想凑 6 人强化，可在「核心盟约」页点盟约卡片里的所属干员，或按阶位 / 时机筛选同阶核心干员。"));
    wrap.replaceChildren(d);
    return;
  }
  wrap.replaceChildren(...cores.map(c => lineupCard(c, o)));
}

function renderDetail(o){
  document.title = o.name + " · 干员详情 | 卫戍协议·规程";

  const col = TIER_COLOR[o.tier] || "#9fb0b0";
  const head = $("#dhead");
  head.replaceChildren();

  const port = el("div", "portrait");
  if(o.img){
    const im = el("img"); im.src = o.img; im.alt = o.name + " 立绘";
    port.append(im);
  } else {
    port.append(el("span", "fb", o.name.slice(0, 1)));
  }
  const badge = el("b", "avt", TIER_LABEL[o.tier] || "?");
  badge.style.color = col;
  port.append(badge);

  const box = el("div");
  box.append(el("h2", null, o.name));
  const sub = el("p", "dsub");
  sub.append(document.createTextNode((TIER_LABEL[o.tier] || "?") + " 阶 · " + o.covenants.length + " 个盟约"));
  if(o.proto) sub.append(document.createTextNode(" · 原型 " + o.proto));
  const tags = el("div", "covtags");
  for(const cov of o.covenants){
    const t = el("span", "tag", cov);
    t.title = "查看「" + cov + "」盟约详情";
    t.onclick = (e) => { e.stopPropagation(); goCov(cov); };
    tags.append(t);
  }
  box.append(sub, tags);
  head.append(port, box, el("span", "mark", TIER_LABEL[o.tier] || "?"));

  const tc = $("#dtrait");
  tc.replaceChildren(el("h3", null, "模式特质"));
  if(o.traitPair && o.traitNormal !== o.traitElite){
    tc.append(traitBlock("普通", o.traitNormal, false), traitBlock("精锐", o.traitElite, true));
    const det = el("details", "draw");
    det.append(el("summary", null, "原文（普通 / 精锐数值并排）"));
    const p = el("p", "dtext"); p.append(frag(o.trait)); det.append(p);
    tc.append(det);
    tc.append(el("p", "dhint", "两档按斜杠“左普通 / 右精锐”拆分，只替换数字；句中若另有“精锐…”的文字说明，两档都会保留，以原文为准。"));
  } else {
    tc.append(traitBlock("特质", o.trait, false, "原文未分档"));
    tc.append(el("p", "dhint", "原文没有数值分档；若句中另有“身前一格 / 两格”“精锐为两倍”“精锐无此条件”等表述，以原文为准。"));
  }

  const mc = $("#dmeta");
  mc.replaceChildren(el("h3", null, "速览"));

  const r1 = el("div", "row");
  r1.append(el("span", "lbl", "触发时机"));
  const tl = (o.tags || []);
  if(tl.length) tl.forEach(t => {
    const k = el("span", "kv", "<" + t + ">");
    k.style.cursor = "pointer"; k.title = "只看该时机的干员";
    k.onclick = () => { location.href = "ops.html?tag=" + encodeURIComponent(t); };
    r1.append(k);
  });
  else r1.append(el("span", "kv", "常驻"));
  mc.append(r1);

  const r2 = el("div", "row");
  r2.append(el("span", "lbl", "阶位"));
  r2.append(el("span", "kv gold", (TIER_LABEL[o.tier] || "?") + " 阶"));
  r2.append(el("span", "kv", "本阶 " + DATA.operators.filter(x => x.tier === o.tier).length + " 人"));
  r2.append(el("span", "kv", "全表 " + DATA.operators.length + " 人"));
  mc.append(r2);

  const r3 = el("div", "row");
  r3.append(el("span", "lbl", "盟约"));
  for(const name of o.covenants){
    const c = DATA.covenants.find(x => x.name === name);
    const k = el("span", "kv", name + (c ? " · 激活 " + c.activation + " 人" : ""));
    k.style.cursor = "pointer";
    k.title = "查看盟约详情";
    k.onclick = () => goCov(name);
    r3.append(k);
  }
  mc.append(r3);
  mc.append(el("p", "dhint", "作战技能与干员本体一致（S1 / S2 / S3）；模式内额外能力只有上方的「特质」。"));

  $("#dcovs").replaceChildren(...o.covenants.map(name => {
    const c = DATA.covenants.find(x => x.name === name);
    return c ? covCard(c, { detail: true, self: o.name })
             : el("div", "empty", "未知盟约：" + name);
  }));
  renderLineup(o);
  updateNav(o);
}

function updateNav(o){
  const list = DATA.operators;
  const i = list.findIndex(x => x.name === o.name);
  const pos = $("#dpos");
  if(pos) pos.textContent = (i + 1) + " / " + list.length + " · " + (TIER_LABEL[o.tier] || "?") + " 阶";
  const prev = $("#dprev"), next = $("#dnext");
  if(prev){
    prev.disabled = i <= 0;
    prev.onclick = () => { if(i > 0) goOp(list[i - 1].name); };
  }
  if(next){
    next.disabled = i >= list.length - 1;
    next.onclick = () => { if(i < list.length - 1) goOp(list[i + 1].name); };
  }
}

/* ---------- 盟约详情 ---------- */
function renderCov(c){
  document.title = c.name + " · 盟约详情 | 卫戍协议·规程";
  setActive(c.core ? "core" : "extra");

  const head = $("#chead");
  head.className = "chead" + (c.core ? "" : " extra");
  head.replaceChildren();

  const box = el("div");
  box.append(el("span", "cbadge" + (c.core ? "" : " extra"), c.core ? "核心盟约" : "附加盟约"));
  const h = el("h2");
  h.append(document.createTextNode(c.name), el("span", "cact", "激活 " + c.activation + " 人"));
  box.append(h);

  const mem = c.members || [];
  const tiers = [...new Set(mem.map(m => m.tier))].sort((a, b) => a - b);
  const tierTxt = tiers.length >= 6 ? "Ⅰ–Ⅵ 阶" : tiers.map(t => TIER_LABEL[t]).join(" · ") + " 阶";
  const sub = el("p", "dsub");
  sub.append(document.createTextNode(
    mem.length + " 名所属干员 · 覆盖 " + tierTxt +
    (c.core ? " · 在场 6 名不同干员时触发强化" : " · 达到激活人数即生效")
  ));
  box.append(sub);
  head.append(box, el("span", "mark", c.name.slice(0, 1)));

  const ef = $("#ceffects");
  ef.replaceChildren(el("h3", null, "盟约效果"));
  ef.append(covFx(c));
  if(mem.length){
    const st = el("p", "covstat");
    if(c.core){
      st.append(document.createTextNode("本盟约共 "), el("b", null, String(mem.length)), document.createTextNode(" 名干员 · 6 人强化："));
      st.append(document.createTextNode(mem.length >= 6 ? "已满足" : "还差 " + (6 - mem.length) + " 名不同干员"));
    } else {
      st.append(document.createTextNode("本盟约共 "), el("b", null, String(mem.length)), document.createTextNode(" 名可激活干员"));
    }
    ef.append(st);
  }

  const info = $("#cinfo");
  info.replaceChildren(el("h3", null, "速览"));
  const addRow = (label, ...kvs) => {
    const r = el("div", "row");
    r.append(el("span", "lbl", label));
    kvs.forEach(k => r.append(k));
    info.append(r);
  };
  addRow("类型", el("span", "kv" + (c.core ? " gold" : ""), c.core ? "核心盟约" : "附加盟约"));
  addRow("激活", el("span", "kv gold", c.activation + " 人"), el("span", "kv", "所属 " + mem.length + " 人"));

  const tierRow = el("div", "row");
  tierRow.append(el("span", "lbl", "阶位覆盖"));
  tiers.forEach(t => {
    const k = el("span", "kv", TIER_LABEL[t]);
    k.style.color = TIER_COLOR[t];
    tierRow.append(k);
  });
  info.append(tierRow);
  addRow("强化", el("span", "kv", c.core ? "6 名不同【" + c.name + "】干员" : "无 6 人强化"));
  info.append(el("p", "dhint", c.core
    ? "强化效果见左侧「6 名不同干员」条目；核心盟约需先激活 3 人。"
    : "附加盟约按激活人数直接生效，没有 6 人强化。"));

  const wrap = $("#cmembers");
  wrap.replaceChildren();
  if(!mem.length){
    wrap.append(el("div", "empty", "该盟约暂无记录干员。"));
    return;
  }
  for(const t of tiers){
    const list = mem.filter(m => m.tier === t);
    const group = el("div", "tgroup");
    const gh = el("div", "tg-head");
    gh.append(el("b", null, TIER_LABEL[t] + " 阶"), el("span", null, "· " + list.length + " 名"));
    group.append(gh);

    const grid = el("div", "mgrid");
    list.forEach(m => {
      const o = DATA.operators.find(x => x.name === m.name);
      const card = el("div", "mcard");
      card.tabIndex = 0;
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", m.name + " · 查看干员详情");
      card.append(avBox(o || { name: m.name, tier: m.tier }));
      const tx = el("div", "tx");
      tx.append(el("div", "mn", m.name));
      const others = (o ? o.covenants : []).filter(n => n !== c.name);
      tx.append(el("div", "mc", others.length ? others.join(" · ") : "仅此盟约"));
      card.append(tx);
      card.onclick = () => goOp(m.name);
      card.onkeydown = (e) => {
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); goOp(m.name); }
      };
      grid.append(card);
    });
    group.append(grid);
    wrap.append(group);
  }
}

/* ---------- 列表页 ---------- */
function filteredOps(state){
  const q = state.q.trim().toLowerCase();
  return DATA.operators.filter(o => {
    if(state.tier && String(o.tier) !== state.tier) return false;
    if(state.cov && !o.covenants.includes(state.cov)) return false;
    if(state.tag && !(o.tags || []).includes(state.tag)) return false;
    if(q){
      const hay = (o.name + " " + (o.proto||"") + " " + o.covenants.join(" ") + " " + o.trait).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}

function initOps(){
  const state = {
    q: QS.get("q") || "",
    tier: QS.get("tier") || "",
    cov: QS.get("cov") || "",
    tag: QS.get("tag") || ""
  };
  const list = $("#oplist");
  let items = [], shown = 0, sentinel = null, io = null;

  const syncUrl = () => {
    const p = new URLSearchParams();
    if(state.q) p.set("q", state.q);
    if(state.tier) p.set("tier", state.tier);
    if(state.cov) p.set("cov", state.cov);
    if(state.tag) p.set("tag", state.tag);
    const qs = p.toString();
    try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "")); } catch(e) {}
  };

  const syncControls = () => {
    $("#q").value = state.q;
    $("#covSel").value = state.cov;
    $("#tagSel").value = state.tag;
    $$(".tbtn").forEach(b => b.classList.toggle("active", b.dataset.tier === state.tier));
  };

  const removeSentinel = () => {
    if(io){ io.disconnect(); io = null; }
    if(sentinel){ sentinel.remove(); sentinel = null; }
  };

  const appendMore = () => {
    const end = Math.min(items.length, shown + PAGE_SIZE);
    const f = document.createDocumentFragment();
    for(let i = shown; i < end; i++) f.append(opRow(items[i]));
    list.append(f);
    shown = end;
    if(shown < items.length){
      if(!sentinel){
        sentinel = el("div", "ops-more", "继续向下滚动加载更多（" + shown + " / " + items.length + "）");
        sentinel.onclick = appendMore;
        list.append(sentinel);
        if("IntersectionObserver" in window){
          io = new IntersectionObserver((es) => { if(es[0].isIntersecting) appendMore(); }, { rootMargin: "700px 0px" });
          io.observe(sentinel);
        }
      } else {
        sentinel.textContent = "继续向下滚动加载更多（" + shown + " / " + items.length + "）";
        list.append(sentinel);
      }
    } else {
      removeSentinel();
    }
  };

  const updateCount = () => {
    $("#count").replaceChildren(
      document.createTextNode("显示 "), el("b", null, String(items.length)),
      document.createTextNode(" / " + DATA.operators.length + " 名干员")
    );
    $("#reset").hidden = !(state.q || state.tier || state.cov || state.tag);
  };

  const render = () => {
    items = filteredOps(state);
    shown = 0;
    list.replaceChildren();
    removeSentinel();
    if(!items.length){
      const e = el("div", "empty");
      e.append(document.createTextNode("没有符合条件的干员，试试 "));
      const b = el("b", null, "重置筛选"); b.style.cursor = "pointer";
      b.onclick = () => resetFilters();
      e.append(b, document.createTextNode("。"));
      list.append(e);
    } else {
      appendMore();
      if(!("IntersectionObserver" in window)){
        while(shown < items.length) appendMore();
      }
    }
    updateCount();
  };

  const resetFilters = () => {
    state.q = ""; state.tier = ""; state.cov = ""; state.tag = "";
    syncControls(); syncUrl(); render();
  };

  $("#q").addEventListener("input", (() => {
    let t = null;
    return (e) => {
      state.q = e.target.value;
      clearTimeout(t);
      t = setTimeout(() => { syncUrl(); render(); }, 140);
    };
  })());
  $("#covSel").addEventListener("change", (e) => { state.cov = e.target.value; syncUrl(); render(); });
  $("#tagSel").addEventListener("change", (e) => { state.tag = e.target.value; syncUrl(); render(); });
  $$(".tbtn").forEach(b => b.onclick = () => { state.tier = b.dataset.tier; syncControls(); syncUrl(); render(); });
  $("#reset").onclick = resetFilters;

  // 下拉选项
  $("#covSel").append(...DATA.covenants.map(c => {
    const o = el("option", null, c.name); o.value = c.name; return o;
  }));
  const tagCount = {};
  DATA.operators.forEach(o => (o.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
  Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh"))
    .forEach(([t, n]) => { const o = el("option", null, "<" + t + "> · " + n + " 人"); o.value = t; $("#tagSel").append(o); });

  syncControls();
  render();
}

/* ---------- 首页 / 各页 ---------- */
function setNav(){
  setActive(PAGE === "op" ? "ops" : PAGE);
  const core = DATA.covenants.filter(c => c.core).length;
  const extra = DATA.covenants.filter(c => !c.core).length;
  const n1 = $("#n-core"), n2 = $("#n-extra"), n3 = $("#n-ops");
  if(n1) n1.textContent = core;
  if(n2) n2.textContent = extra;
  if(n3) n3.textContent = DATA.operators.length;
}

function setActive(page){
  $$(".tab").forEach(a => a.classList.toggle("active", a.dataset.page === page));
}

function syncTabH(){
  const t = $(".tabs");
  if(t) document.documentElement.style.setProperty("--tabh", t.getBoundingClientRect().height + "px");
}

function initCovGrid(which){
  const grid = $(which === "core" ? "#coreGrid" : "#extraGrid");
  const covs = DATA.covenants.filter(c => c.core === (which === "core"));
  grid.replaceChildren(...covs.map(c => covCard(c)));
}

function init(){
  syncTabH();
  setNav();
  if(PAGE === "core") initCovGrid("core");
  if(PAGE === "extra") initCovGrid("extra");
  if(PAGE === "ops") initOps();
  if(PAGE === "notes") $("#notesGrid").replaceChildren(...(DATA.notes || []).map(noteCard));

  if(PAGE === "op"){
    const name = QS.get("name") || "";
    const o = DATA.operators.find(x => x.name === name);
    const back = $("#dback"), back2 = $("#dback2");
    if(back) back.onclick = () => goBack("ops.html");
    if(back2) back2.onclick = () => goBack("ops.html");
    if(!o){
      $("#dhead").replaceChildren(el("div", "empty", "找不到干员：" + name));
      return;
    }
    renderDetail(o);
  }

  if(PAGE === "cov"){
    const name = QS.get("name") || "";
    const c = DATA.covenants.find(x => x.name === name);
    const back = $("#cback"), back2 = $("#cback2");
    if(back) back.onclick = () => goBack("index.html");
    if(back2) back2.onclick = () => goBack("index.html");
    const filt = $("#cfilter");
    if(filt && c) filt.onclick = () => { location.href = "ops.html?cov=" + encodeURIComponent(c.name); };
    if(!c){
      $("#chead").replaceChildren(el("div", "empty", "找不到盟约：" + name));
      return;
    }
    renderCov(c);
  }
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

})();
