/* Motor dos Casos em Dupla.
   Cada caso define `const CASO = {...}` num <script> antes de carregar este arquivo.
   Campos do caso: id, titulo, resumo, pessoas, titPessoas, lugar, titLugar, pastas{azul,verm},
   perguntas, solucao, cadaUm, linha.
   Opcional: reviravolta {para:"azul"|"verm"|"ambas", aviso, t, tipo, c}: um documento novo que aparece
   na primeira vez que se clica em "Ir para o relatório final". */
(function(){
"use strict";

const NIVEIS = {
  aberta:   { nome:"Pasta aberta", grau:"fácil",
              desc:"A pasta fica aberta o jogo todo e dá para reler quantas vezes quiser.",
              unica:false },
  unica:    { nome:"Leitura única", grau:"médio",
              desc:"Cada um lê a sua pasta uma vez. Ao terminar, ela fecha e a conversa é de memória. Vale uma caderneta de bolso (200 letras) e uma consulta de emergência: rever um documento por 20 segundos.",
              unica:true, caderneta:200, consulta:true, minutos:0 },
  relogio:  { nome:"Contra o relógio", grau:"difícil",
              desc:"Leitura única com 6 minutos por pasta. Quando o tempo acaba, a pasta fecha sozinha. Sem caderneta e sem consulta.",
              unica:true, caderneta:0, consulta:false, minutos:6 }
};
const PAPEIS = ["azul","verm","ambas"];
const SEGUNDOS_CONSULTA = 20;
const SEGUNDOS_NOVIDADE = 60;
const NOV = CASO.reviravolta || null;

const app = document.getElementById("app");
const PREF = "casodupla-" + CASO.id + ":";
const memoria = {};
function guardar(k,v){ memoria[k]=v; try{ localStorage.setItem(PREF+k, v); }catch(e){} }
function ler(k){ try{ const v = localStorage.getItem(PREF+k); if(v!==null) return v; }catch(e){} return memoria[k] || ""; }
function apagar(k){ delete memoria[k]; try{ localStorage.removeItem(PREF+k); }catch(e){} }
const esc = s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");

let papel = null;
let tique = null;
function pararRelogio(){ if(tique){ clearInterval(tique); tique=null; } }
function tela(html){ pararRelogio(); app.innerHTML = html; scrollTo(0,0); }

function nivelId(){ return NIVEIS[ler("nivel")] ? ler("nivel") : "unica"; }
function nivel(){ return NIVEIS[nivelId()]; }
function partidaComecou(){ return PAPEIS.some(p=>ler("inicio-"+p) || ler("fechada-"+p)); }
function chavesDe(qual){ return qual==="ambas" ? ["azul","verm"] : [qual]; }
function rotulo(qual){ return qual==="ambas" ? "Jogo solo" : CASO.pastas[qual].jogador; }
function mmss(ms){ const s=Math.max(0,Math.ceil(ms/1000)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }

function cabecalho(){
  return `<h1>${CASO.titulo}</h1><p class="sub">Um caso para dois detetives</p>`;
}
function blocoComum(){
  return `<div class="cartao">${CASO.resumo}</div>
<h2>${CASO.titPessoas}</h2>
<div class="cartao"><ul class="pessoas">${CASO.pessoas.map(p=>`<li><b>${p[0]}</b>: ${p[1]}</li>`).join("")}</ul></div>
<h2>${CASO.titLugar}</h2><div class="cartao">${CASO.lugar}</div>`;
}
function topo(qual){
  return `<div class="topo"><span class="faixa ${qual==="ambas"?"azul":qual}">${rotulo(qual)} · ${nivel().nome}</span><button class="link" onclick="CD.inicio()">Início</button></div>`;
}

/* ---------- início: nível e pasta ---------- */
function inicio(){
  papel = null;
  const travado = partidaComecou();
  const atual = nivelId();
  const escolha = travado
    ? `<div class="cartao"><p style="margin:0">Nível desta partida: <b>${NIVEIS[atual].nome}</b> <span style="color:var(--suave);font-size:.85rem">(${NIVEIS[atual].grau})</span></p>
<p style="margin:.4em 0 0;color:var(--suave);font-size:.95rem">A partida já começou, então o nível não muda mais. Para jogar de novo em outro nível, use "Recomeçar o caso" lá embaixo.</p></div>`
    : `<div class="niveis">${Object.entries(NIVEIS).map(([id,n])=>`<label class="${id===atual?"marcado":""}"><input type="radio" name="nivel" value="${id}" ${id===atual?"checked":""} onchange="CD.escolherNivel(this.value)"><b>${n.nome}</b><span class="grau">${n.grau}</span><small>${n.desc}</small></label>`).join("")}</div>`;
  tela(cabecalho() + `
<div class="cartao">
<p><b>Como se joga</b></p>
<ul class="pessoas">
<li>Combinem o nível: os dois jogam no mesmo.</li>
<li>Cada um fica com uma pasta: um com a <b>Azul</b>, o outro com a <b>Vermelha</b>. Pode ser cada um no seu aparelho ou revezando no mesmo.</li>
<li>Na <b>leitura única</b>, leiam em silêncio. Quando os dois tiverem fechado as pastas, conversem e montem o caso só com o que lembram.</li>
<li>Quando acharem que resolveram, entreguem o relatório. Não há limite de tempo para a conversa.</li>
</ul></div>
<h2>Nível</h2>${escolha}
<h2>Pasta</h2>
<div class="botoes">
${["azul","verm"].map(q=>`<button class="${q}" onclick="CD.abrir('${q}')">${CASO.pastas[q].jogador}: ${CASO.pastas[q].nome}${ler("fechada-"+q)?" (já lida, fechada)":""}<small>${CASO.pastas[q].desc}</small></button>`).join("")}
</div>
<button class="link" onclick="CD.abrir('ambas')">Ver as duas pastas (só para quem joga sozinho)</button>
${travado?`<p><button class="link" onclick="CD.recomecar()">Recomeçar o caso (reabre as pastas e apaga as anotações)</button></p>`:""}
<p><a href="index.html" style="color:var(--suave)">Todos os casos</a></p>`);
}

function escolherNivel(id){
  if(partidaComecou()) return;
  guardar("nivel", id);
  document.querySelectorAll(".niveis label").forEach(l=>l.classList.toggle("marcado", l.querySelector("input").value===id));
}

function recomecar(){
  if(!confirm("Recomeçar o caso? As pastas reabrem e as anotações deste aparelho são apagadas.")) return;
  for(const p of PAPEIS) for(const k of ["inicio-","fechada-","caderneta-","conversa-","consulta-","notas-","novidade-"]) apagar(k+p);
  inicio();
}

/* ---------- documentos ---------- */
function recebe(qual){ return !!NOV && (qual==="ambas" || NOV.para==="ambas" || NOV.para===qual); }
function novidadeHtml(){ return `<div class="cartao doc novidade"><h3>${NOV.t}<span class="tipo">${NOV.tipo}</span></h3>${NOV.c}</div>`; }
function docHtml(chave, d, aberto){
  return aberto
    ? `<div class="cartao doc ${chave}"><h3>${d.t}<span class="tipo">${d.tipo}</span></h3>${d.c}</div>`
    : `<details class="cartao doc ${chave}"><summary>${d.t}<span class="tipo">${d.tipo}</span></summary>${d.c}</details>`;
}
function pastasHtml(qual, aberto){
  if(qual==="ambas") return ["azul","verm"].map(k=>`<h2><span class="faixa ${k}">${CASO.pastas[k].nome}</span></h2>${CASO.pastas[k].docs.map(d=>docHtml(k,d,aberto)).join("")}`).join("");
  const p = CASO.pastas[qual];
  return `<h2>Sua pasta <span class="faixa ${qual}">${p.nome}</span></h2>
<p class="sub">${aberto?"":"Toque em cada documento para abrir. "}Seu parceiro tem outros documentos.</p>${p.docs.map(d=>docHtml(qual,d,aberto)).join("")}`;
}

function abrir(qual){
  papel = qual;
  const n = nivel();
  if(!n.unica) return pastaAberta(qual);
  if(ler("fechada-"+qual)) return conversa(qual, false);
  leitura(qual);
}

/* nível fácil: como sempre foi */
function pastaAberta(qual){
  const nova = recebe(qual) && ler("novidade-"+qual) ? `<h2>Novidade</h2>${novidadeHtml()}` : "";
  tela(topo(qual) + cabecalho() + blocoComum() + pastasHtml(qual, false) + nova + `
<h2>Suas anotações</h2>
<textarea id="notas" placeholder="Anote aqui o que o parceiro contar, horários, suspeitas...">${esc(ler("conversa-"+qual))}</textarea>
<div class="botoes"><button class="prim" onclick="CD.relatorio()">Ir para o relatório final<small>só quando os dois tiverem combinado as respostas</small></button></div>`);
  document.getElementById("notas").addEventListener("input", e=>guardar("conversa-"+qual, e.target.value));
}

/* ---------- leitura única ---------- */
function leitura(qual){
  const n = nivel();
  let ini = +ler("inicio-"+qual);
  if(!ini){ ini = Date.now(); guardar("inicio-"+qual, String(ini)); }
  const total = n.minutos * 60000 * chavesDe(qual).length;
  const regras = total
    ? `Você tem <b>${n.minutos*chavesDe(qual).length} minutos</b>. Quando o relógio zerar, a pasta fecha sozinha e não abre mais. Não vale anotar em papel.`
    : `Leia com calma, sem limite de tempo. Quando clicar em "Terminei a leitura", a pasta fecha e não abre mais nesta partida. Não vale anotar em papel: a única anotação permitida é a caderneta de bolso, lá no fim.`;
  const caderneta = n.caderneta ? `
<h2>Caderneta de bolso</h2>
<p class="sub">Só ${n.caderneta} letras. Escolha bem: é a única coisa que sai da pasta com você.</p>
<textarea id="caderneta" class="curta" maxlength="${n.caderneta}" placeholder="Um horário, um nome, um detalhe...">${esc(ler("caderneta-"+qual))}</textarea>
<div class="contador" id="conta"></div>` : "";
  tela((total?`<div class="relogio" id="relogio"><span>Leitura</span><b id="resta">${mmss(total)}</b></div>`:"")
    + topo(qual) + cabecalho()
    + `<p class="dica"><b>Leitura única.</b> ${regras}</p>`
    + blocoComum() + pastasHtml(qual, true) + caderneta + `
<div class="botoes"><button class="prim" onclick="CD.fechar('${qual}')">Terminei a leitura: fechar a pasta<small>depois disso, só a memória</small></button></div>`);

  if(n.caderneta){
    const t = document.getElementById("caderneta"), c = document.getElementById("conta");
    const atualiza = ()=>{ c.textContent = t.value.length + " / " + n.caderneta; };
    t.addEventListener("input", ()=>{ guardar("caderneta-"+qual, t.value); atualiza(); });
    atualiza();
  }
  if(total){
    const passo = ()=>{
      const resta = ini + total - Date.now();
      if(resta <= 0){ fechar(qual, true); return; }
      const r = document.getElementById("resta"); if(r) r.textContent = mmss(resta);
      document.getElementById("relogio").classList.toggle("fim", resta <= 60000);
    };
    passo();
    if(!ler("fechada-"+qual)) tique = setInterval(passo, 500);
  }
}

function fechar(qual, porTempo){
  if(!porTempo && !confirm("Fechar a pasta? Ela não abre mais nesta partida.")) return;
  guardar("fechada-"+qual, "1");
  conversa(qual, porTempo);
}

function conversa(qual, porTempo){
  const n = nivel();
  const nota = ler("caderneta-"+qual);
  const usada = ler("consulta-"+qual);
  let consulta = "";
  if(n.consulta){
    if(usada){
      consulta = `<h2>Consulta de emergência</h2><p class="sub">Já usada: ${esc(usada)}.</p>`;
    } else {
      const lista = chavesDe(qual).flatMap(k=>CASO.pastas[k].docs.map((d,i)=>`<button onclick="CD.consultar('${qual}','${k}',${i})">${qual==="ambas"?`<span class="faixa ${k}">${CASO.pastas[k].nome}</span> `:""}${d.t}</button>`)).join("");
      consulta = `<h2>Consulta de emergência</h2>
<details class="cartao"><summary style="cursor:pointer">Rever um documento por ${SEGUNDOS_CONSULTA} segundos (só uma vez)</summary>
<p class="sub" style="margin-top:.6em">Escolha com cuidado: depois de usar, não há outra.</p>
<div class="consulta-docs">${lista}</div></details>
<div id="consulta"></div>`;
    }
  }
  tela(topo(qual) + cabecalho()
    + (porTempo?`<p class="aviso">O tempo acabou e a pasta fechou.</p>`:"")
    + `<div class="cartao"><p style="margin:0"><b>Sua pasta está fechada.</b> Agora é com a memória: cada um conta ao outro o que leu, e juntos vocês montam o caso.</p></div>`
    + (nota?`<h2>Sua caderneta de bolso</h2><div class="cartao" style="white-space:pre-wrap">${esc(nota)}</div>`:"")
    + consulta
    + (recebe(qual) && ler("novidade-"+qual) ? `<h2>Novidade</h2><p class="sub">Já lida: ${NOV.t}.</p>` : "")
    + `<h2>Anotações da conversa</h2>
<textarea id="notas" placeholder="Anote o que forem descobrindo juntos: horários, suspeitas, contradições...">${esc(ler("conversa-"+qual))}</textarea>
<div class="botoes"><button class="prim" onclick="CD.relatorio()">Ir para o relatório final<small>só quando os dois tiverem combinado as respostas</small></button></div>
<details class="cartao"><summary style="cursor:pointer">Rever o começo do caso (resumo, pessoas e local)</summary>${blocoComum()}</details>`);
  document.getElementById("notas").addEventListener("input", e=>guardar("conversa-"+qual, e.target.value));
}

function consultar(qual, k, i){
  if(ler("consulta-"+qual)) return;
  const d = CASO.pastas[k].docs[i];
  if(!confirm(`Usar a consulta de emergência em "${d.t}"? Ele fica na tela por ${SEGUNDOS_CONSULTA} segundos.`)) return;
  guardar("consulta-"+qual, d.t);
  document.querySelectorAll(".consulta-docs button").forEach(b=>b.disabled=true);
  const caixa = document.getElementById("consulta");
  const fim = Date.now() + SEGUNDOS_CONSULTA*1000;
  caixa.innerHTML = `<div class="relogio fim" style="margin:0 0 8px;border-radius:8px"><span>Consulta</span><b id="resta-c">${mmss(fim-Date.now())}</b></div>${docHtml(k,d,true)}`;
  caixa.scrollIntoView({behavior:"smooth", block:"start"});
  pararRelogio();
  tique = setInterval(()=>{
    const resta = fim - Date.now();
    if(resta <= 0){ conversa(qual, false); return; }
    const r = document.getElementById("resta-c"); if(r) r.textContent = mmss(resta);
  }, 250);
}

/* ---------- relatório ---------- */
function novidade(qual){
  guardar("novidade-"+qual, "1");
  const n = nivel();
  if(!recebe(qual)){
    const outra = CASO.pastas[NOV.para];
    tela(topo(qual) + cabecalho() + `<p class="dica"><b>Espere: o caso mudou.</b> Enquanto vocês conversavam, chegou uma novidade, e ela foi parar na <b>${outra.nome}</b>. Esperem quem está com ela ler e contar o que é. Só depois fechem o relatório.</p>
<div class="botoes"><button class="prim" onclick="CD.abrir('${qual}')">Voltar para a discussão</button></div>`);
    return;
  }
  const seg = n.unica && n.minutos ? SEGUNDOS_NOVIDADE : 0;
  const regra = !n.unica ? "Ela fica guardada na sua pasta."
    : seg ? `Você tem ${seg} segundos. Depois ela some, como a pasta.`
    : "Leia com atenção: como a pasta, ela só aparece esta vez.";
  tela((seg?`<div class="relogio fim" id="relogio"><span>Novidade</span><b id="resta">${mmss(seg*1000)}</b></div>`:"")
    + topo(qual) + cabecalho()
    + `<p class="dica"><b>Novidade no caso!</b> ${NOV.aviso} ${regra}</p>` + novidadeHtml() + `
<div class="botoes"><button class="prim" onclick="CD.abrir('${qual}')">Voltar para a discussão<small>contem um ao outro antes de fechar o relatório</small></button></div>`);
  if(seg){
    const fim = Date.now() + seg*1000;
    tique = setInterval(()=>{
      const resta = fim - Date.now();
      if(resta <= 0){ abrir(qual); return; }
      const r = document.getElementById("resta"); if(r) r.textContent = mmss(resta);
    }, 250);
  }
}

function relatorio(){
  if(NOV && papel && !ler("novidade-"+papel)) return novidade(papel);
  const voltar = papel;
  tela(cabecalho() + `<h2>Relatório final</h2>
<p class="aviso">Combinem as respostas antes de entregar. Depois da entrega, a solução aparece na tela.</p>
${CASO.perguntas.map((q,i)=>`<div class="perg"><p><b>${i+1}. ${q.t}</b></p>${q.ops.map(o=>`<label><input type="radio" name="${q.id}" value="${o[0]}">${o[1]}</label>`).join("")}</div>`).join("")}
<p id="falta" class="aviso escondido">Responda a todas as perguntas antes de entregar.</p>
<div class="botoes"><button class="prim" onclick="CD.entregar()">Entregar o relatório</button>
<button class="link" onclick="CD.abrir('${voltar}')">Voltar</button></div>`);
}

function entregar(){
  const resp = {};
  for(const q of CASO.perguntas){
    const m = document.querySelector(`input[name="${q.id}"]:checked`);
    if(!m){ document.getElementById("falta").classList.remove("escondido"); return; }
    resp[q.id] = m.value;
  }
  let acertos = 0;
  const itens = CASO.perguntas.map(q=>{
    const ok = resp[q.id]===q.certa; if(ok) acertos++;
    const sua = q.ops.find(o=>o[0]===resp[q.id])[1];
    const certa = q.ops.find(o=>o[0]===q.certa)[1];
    return `<li><b>${q.t}</b><br><span class="${ok?"certo":"errado"}">${ok?"✔ Certo":"✘ Errado"}</span>: ${sua}${ok?"":`<br><i>Resposta certa:</i> ${certa}`}</li>`;
  }).join("");
  const total = CASO.perguntas.length;
  const nota = (acertos*10/total).toLocaleString("pt-BR",{minimumFractionDigits:1, maximumFractionDigits:1});
  const frase = acertos===total ? "Caso resolvido. O culpado vai responder pelo crime."
    : acertos>=total/2 ? "Vocês chegaram perto, mas a defesa vai explorar as falhas do relatório."
    : "O caso ficou em aberto. O culpado segue livre, por enquanto.";
  tela(cabecalho() + `
<div class="cartao"><p style="margin:0">Nota da dupla · nível ${nivel().nome}</p><p class="nota">${nota} / 10</p><p>${frase}</p></div>
<h2>Suas respostas</h2><div class="cartao"><ul class="pessoas">${itens}</ul></div>
<h2>O que aconteceu</h2><div class="cartao">${CASO.solucao}</div>
<h2>E os outros?</h2><div class="cartao"><ul class="pessoas">${CASO.cadaUm.map(c=>`<li><b>${c[0]}</b>: ${c[1]}</li>`).join("")}</ul></div>
<h2>Hora a hora</h2><div class="cartao"><ul class="linha-tempo">${CASO.linha.map(l=>`<li><b>${l[0]}</b>${l[1]}</li>`).join("")}</ul></div>
<details class="cartao"><summary style="cursor:pointer"><b>Rever as duas pastas completas</b></summary>${pastasHtml("ambas", true)}${NOV?`<h2><span class="faixa ${NOV.para==="verm"?"verm":"azul"}">Novidade</span></h2>${novidadeHtml()}`:""}</details>
<div class="botoes"><button onclick="CD.inicio()">Voltar ao início</button></div>`);
}

window.CD = { inicio, escolherNivel, recomecar, abrir, fechar, consultar, relatorio, entregar };
inicio();
})();
