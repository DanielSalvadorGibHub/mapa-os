/**
 * Agendamento Automático Direct — armazenamento em planilha
 *
 * Guarda o histórico de ocorrências e o cache de endereços numa
 * planilha do Google, para que todas as máquinas da equipe usem a
 * mesma base — em vez de cada navegador ter a sua.
 *
 * COMO PUBLICAR
 *  1. Crie uma planilha nova no Google Sheets.
 *  2. Extensões → Apps Script. Apague o conteúdo e cole este arquivo.
 *  3. Implantar → Nova implantação → tipo "App da Web".
 *       Executar como:   Eu
 *       Quem tem acesso: Qualquer pessoa
 *  4. Copie a URL que termina em /exec e cole no campo
 *     "Planilha de sincronização" da ferramenta.
 *
 * Sobre o acesso "Qualquer pessoa": é o que permite a página chamar o
 * script. Quem tiver a URL consegue ler e gravar, então trate-a como
 * senha — não publique no repositório nem em grupo aberto. Para
 * restringir mais, defina um SEGREDO abaixo e informe o mesmo valor na
 * ferramenta; requisições sem ele são recusadas.
 */

const SEGREDO = '';                   // opcional: ex. 'direct-2026'
const ABA_OS = 'ocorrencias';
const ABA_END = 'enderecos';
const ABA_LOG = 'registro';

/* ---------------------------------------------------------------- */

function doGet(e) {
  try {
    const p = e.parameter || {};
    if (!autorizado(p.segredo)) return json({ erro: 'nao autorizado' });

    if (p.acao === 'ping') return json({ ok: true, versao: 1 });
    if (p.acao === 'enderecos') return json({ ok: true, enderecos: lerEnderecos() });
    return json({ ok: true, dias: lerDias(Number(p.desde || 0)) });
  } catch (err) {
    return json({ erro: String(err) });
  }
}

function doPost(e) {
  try {
    const corpo = JSON.parse(e.postData.contents || '{}');
    if (!autorizado(corpo.segredo)) return json({ erro: 'nao autorizado' });

    let gravadas = 0, novosEnd = 0;
    if (corpo.dia && corpo.ocorrencias) gravadas = gravarDia(corpo.dia, corpo.ocorrencias, corpo.usuario);
    if (corpo.enderecos) novosEnd = gravarEnderecos(corpo.enderecos);

    return json({ ok: true, gravadas: gravadas, enderecos: novosEnd });
  } catch (err) {
    return json({ erro: String(err) });
  }
}

/* ---------------------------------------------------------------- */

function autorizado(s) {
  return !SEGREDO || String(s || '') === SEGREDO;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function aba(nome, cabecalho) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let s = doc.getSheetByName(nome);
  if (!s) {
    s = doc.insertSheet(nome);
    s.appendRow(cabecalho);
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold');
  }
  return s;
}

const abaOS = () => aba(ABA_OS,
  ['dia', 'os', 'chave', 'cliente', 'endereco', 'bairro', 'cidade',
   'tipo', 'plano', 'tecnico', 'especialidade', 'reincidente', 'atualizado_em']);

const abaEnd = () => aba(ABA_END,
  ['endereco', 'lat', 'lon', 'precisao', 'fonte', 'atualizado_em']);

const abaLog = () => aba(ABA_LOG, ['quando', 'usuario', 'dia', 'ocorrencias']);

/* ---------------------------------------------------------------- */

/** Regrava o dia inteiro: apaga o que havia daquela data e insere de novo. */
function gravarDia(dia, ocorrencias, usuario) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(30000);
  try {
    const s = abaOS();
    const total = s.getLastRow();
    if (total > 1) {
      const datas = s.getRange(2, 1, total - 1, 1).getValues();
      for (let i = datas.length - 1; i >= 0; i--) {
        if (String(datas[i][0]) === dia) s.deleteRow(i + 2);
      }
    }
    const agora = new Date();
    const linhas = ocorrencias.map(function (o) {
      return [dia, o.os || '', o.k || '', o.cliente || '', o.endereco || '',
              o.bairro || '', o.cidade || '', o.tipo || '', o.plano || '',
              o.tecnico || '', o.esp || '', o.rep ? 1 : 0, agora];
    });
    if (linhas.length) s.getRange(s.getLastRow() + 1, 1, linhas.length, linhas[0].length).setValues(linhas);

    abaLog().appendRow([agora, usuario || '', dia, linhas.length]);
    return linhas.length;
  } finally {
    bloqueio.releaseLock();
  }
}

/** Guarda coordenadas já descobertas, para não gastar consulta de novo. */
function gravarEnderecos(mapa) {
  const bloqueio = LockService.getScriptLock();
  bloqueio.waitLock(30000);
  try {
    const s = abaEnd();
    const existentes = {};
    const total = s.getLastRow();
    if (total > 1) {
      s.getRange(2, 1, total - 1, 1).getValues().forEach(function (l, i) {
        existentes[String(l[0])] = i + 2;
      });
    }
    const agora = new Date();
    const novas = [];
    Object.keys(mapa).forEach(function (chave) {
      const v = mapa[chave];
      if (!v || v.length < 2) return;
      const linha = [chave, v[0], v[1], v[2] || '', v[3] || '', agora];
      if (existentes[chave]) {
        s.getRange(existentes[chave], 1, 1, linha.length).setValues([linha]);
      } else {
        novas.push(linha);
      }
    });
    if (novas.length) s.getRange(s.getLastRow() + 1, 1, novas.length, novas[0].length).setValues(novas);
    return novas.length;
  } finally {
    bloqueio.releaseLock();
  }
}

/* ---------------------------------------------------------------- */

function lerDias(desde) {
  const s = abaOS();
  const total = s.getLastRow();
  if (total < 2) return {};

  const dados = s.getRange(2, 1, total - 1, 12).getValues();
  const corte = desde ? new Date(desde) : null;
  const saida = {};

  dados.forEach(function (l) {
    const dia = formatarDia(l[0]);
    if (!dia) return;
    if (corte && new Date(dia + 'T12:00:00') < corte) return;
    (saida[dia] = saida[dia] || []).push({
      os: String(l[1]), k: String(l[2]), cliente: String(l[3]), endereco: String(l[4]),
      bairro: String(l[5]), cidade: String(l[6]), tipo: String(l[7]), plano: String(l[8]),
      tecnico: String(l[9]), esp: String(l[10]), rep: Number(l[11]) || 0
    });
  });
  return saida;
}

function lerEnderecos() {
  const s = abaEnd();
  const total = s.getLastRow();
  if (total < 2) return {};
  const dados = s.getRange(2, 1, total - 1, 5).getValues();
  const saida = {};
  dados.forEach(function (l) {
    if (!l[0]) return;
    saida[String(l[0])] = [Number(l[1]), Number(l[2]), String(l[3] || ''), String(l[4] || '')];
  });
  return saida;
}

/** A célula pode voltar como texto ou como data, dependendo da formatação. */
function formatarDia(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const t = String(v || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const br = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return br ? br[3] + '-' + br[2] + '-' + br[1] : '';
}

/* ---------------------------------------------------------------- */

/** Roda uma vez pelo editor para conferir que tudo está no lugar. */
function testar() {
  abaOS(); abaEnd(); abaLog();
  Logger.log('Abas criadas. Dias na planilha: ' + Object.keys(lerDias(0)).length);
  Logger.log('Endereços em cache: ' + Object.keys(lerEnderecos()).length);
}
