# MAPA OS — distribuição diária de ordens de serviço

Ferramenta web para plotar no mapa as OS do dia exportadas do HubSoft, dividir os
atendimentos entre as equipes por proximidade e **avisar quando o mesmo endereço
volta a abrir chamado dentro da semana**.

Roda inteiro no navegador. Nenhum dado de cliente sai do computador de quem usa,
exceto a consulta de endereço → coordenadas (veja *Privacidade*).

**Acesse:** https://SEU-USUARIO.github.io/mapa-os/
**Demonstração:** abra e clique em *Ver com dados de exemplo* — 16 OS fictícias,
com reincidências já configuradas para mostrar o alerta funcionando.

---

## Para que serve

O relatório de OS do HubSoft sai em Excel, sem mapa. A distribuição para os
técnicos é feita no olho, e uma reincidência — o cliente que reabre chamado dois
ou três dias depois — só aparece quando alguém lembra do nome.

Esta ferramenta resolve as duas coisas:

| Antes | Agora |
|---|---|
| Endereços lidos linha por linha na planilha | Todas as OS plotadas no mapa |
| Divisão por equipe no olho | Divisão automática por região, com carga equilibrada |
| Ordem de visita improvisada | Rota ordenada por proximidade, com link para o Google Maps |
| Reincidência descoberta por acaso | Alerta automático com as datas das ocorrências anteriores |

---

## Uso diário

1. Exporte o relatório de OS do HubSoft (.xlsx ou .csv).
2. Abra a página e solte o arquivo na área de importação.
3. Confira o painel **Reincidências** — quem aparece ali merece um olhar antes
   de mandar o técnico repetir a mesma visita.
4. Ajuste o número de equipes e clique em **Recalcular rotas**.
5. Exporte o CSV da distribuição ou abra a rota de cada equipe no Google Maps.

O layout do relatório do HubSoft já vem reconhecido: `num_o_s`, `cliente`,
`endereco_instalacao`, `tecnicos`, `tipo` e `data_inicio_programado` são
detectados sozinhos, a data da agenda vem do próprio arquivo e o endereço em
campo único (`RUA X, 123, CASA - BAIRRO, CIDADE/UF | CEP: 00000-000`) é
desmembrado automaticamente. Qualquer coluna pode ser corrigida à mão na seção
**Colunas**, e a escolha fica guardada para os próximos dias.

Se o relatório já vier com a coluna `tecnicos` preenchida, a ferramenta respeita
essa divisão. Para o robô montar os grupos por região, escolha *agrupar por
região automaticamente* em **Regras**.

### Técnicos, escalas e especialidade

A seção **Técnicos** guarda a equipe da unidade: nome (igual ao do HubSoft),
função (suporte, instalação, infraestrutura, comercial), uma função secundária
opcional para quem cobre outra área quando a agenda aperta, a escala e as folgas.

- **Segunda a sábado** ou **segunda a sexta**: calculado pelo dia da semana.
- **12x36**: informe uma data em que a pessoa trabalhou; a partir dela a escala
  segue dia sim, dia não.
- Folgas pontuais entram como datas na linha do técnico.

Com isso, ao abrir o arquivo do dia a divisão sai pronta: só entram os técnicos
escalados, cada OS vai para quem atende aquele tipo de serviço, e a divisão
geográfica acontece **dentro** de cada especialidade. Se faltar gente de uma
área, ou se alguém passar do teto de OS por dia, aparece um aviso no topo das
rotas em vez de a ferramenta empurrar a carga em silêncio.

### Regras configuráveis

- **O que conta como repetição:** mesmo endereço (padrão), mesmo cliente ou mesmo contrato.
- **Janela:** 7, 15 ou 30 dias.
- **Níveis:** 2 ocorrências = alerta (âmbar). 3 ou mais = crítico (vermelho, com halo no mapa).
- **Ponto de partida:** marque a sede no mapa para que as rotas comecem dela.
- **Janela pedida:** o horário programado do relatório é ordem de fila, não hora
  marcada. Pedidos reais de período ("de manhã", "após as 15h") são lidos da
  descrição da OS e sinalizados em azul no mapa e na lista — sem alterar a
  ordem da rota.

### Planilha de sincronização

Sem planilha, o histórico fica só no navegador de quem usa — cada máquina com a
sua contagem de reincidência. Com planilha, a base passa a ser da equipe.

Para ligar:

1. Crie uma planilha no Google Sheets.
2. **Extensões → Apps Script**, cole o conteúdo de `planilha/Codigo.gs`.
3. **Implantar → Nova implantação → App da Web**, executando como você e com
   acesso para *qualquer pessoa*.
4. Copie a URL terminada em `/exec` e cole em **Histórico → Planilha de
   sincronização**. Clique em *Testar conexão*.

A partir daí, cada relatório carregado é gravado na planilha automaticamente, e
a página busca o histórico da equipe ao abrir. A planilha cria três abas
sozinha: `ocorrencias`, `enderecos` e `registro`.

O ganho maior é o **cache de endereços compartilhado**: um endereço localizado
numa máquina não é consultado de novo em nenhuma outra — a franquia do Google
rende para a equipe inteira, não por pessoa.

A URL do Apps Script funciona como senha: quem a tiver consegue ler e gravar.
Não a publique no repositório. Para restringir, defina `SEGREDO` no topo do
`Codigo.gs` e informe o mesmo valor na ferramenta.

### Salve a base de vez em quando

O botão **Salvar base** baixa um `.json` com o histórico e os endereços já
localizados — útil como cópia de segurança mesmo com a planilha ligada.

---

## Publicar / atualizar

Repositório público com GitHub Pages ligado no branch `main`, pasta raiz.

```bash
git clone https://github.com/SEU-USUARIO/mapa-os.git
cd mapa-os
# edite index.html
git add .
git commit -m "ajuste na regra de reincidência"
git push
```

O Pages republica em cerca de um minuto. O arquivo `.nojekyll` evita que o
GitHub tente processar a pasta como site Jekyll.

`index.html` é autossuficiente: HTML, CSS e JavaScript no mesmo arquivo. As
únicas dependências são carregadas por CDN (Leaflet para o mapa, SheetJS para
ler o Excel).

---

## Privacidade

- A planilha **não é enviada para lugar nenhum**. É lida dentro do navegador.
- Histórico e endereços já localizados ficam no armazenamento local do
  navegador de quem usa, e no `.json` que você mesmo baixa.
- Para descobrir as coordenadas, vai apenas o endereço — sem nome de cliente,
  sem número de OS, sem contrato. Cada endereço é consultado **uma única vez**;
  depois fica em cache.
- Sem chave do Google, a consulta usa OpenStreetMap e o CEP (BrasilAPI). Com
  chave, usa o geocoder do Google, o mesmo do My Maps.
- **A chave do Google não entra no repositório.** Ela é digitada na tela e fica
  guardada só no navegador de quem usa. Nunca faça commit dela.
- Se a política interna não permitir nem isso, inclua colunas `Latitude` e
  `Longitude` na planilha: a ferramenta usa direto e não consulta nada externo.

O repositório é público, mas contém apenas código e a planilha fictícia de
exemplo em `exemplo/os-exemplo.csv`. Nenhum dado real de cliente entra no Git.

---

## Limites conhecidos

- O serviço de endereços aceita 1 consulta por segundo. Um dia novo com 80 OS
  leva cerca de 90 segundos na primeira carga; nos dias seguintes é imediato,
  porque os endereços repetidos já estão em cache.
- **Precisão dos pontos.** O OpenStreetMap tem pouca cobertura de número de casa
  no Brasil. Sem chave do Google, a busca combina duas fontes: a consulta
  estruturada no OpenStreetMap e a coordenada do CEP. Se as duas discordarem em
  mais de 3 km, a do CEP prevalece — é o que evita o pino cair na rua de mesmo
  nome em outra cidade. O resultado fica em precisão de rua, boa para roteirizar.
- Para precisão de porta há dois caminhos:
  - **Chave do Google Maps** em **Regras**. Crie no Google Cloud, habilite
    *Maps JavaScript API* e restrinja por referenciador HTTP ao endereço do seu
    GitHub Pages. Exige cartão cadastrado; a franquia mensal cobre com folga o
    uso do setor. Coordenadas vindas do Google são reconsultadas a cada 30 dias,
    que é o limite de cache permitido pelos termos de uso.
  - **Ida e volta pelo My Maps**, sem chave e sem custo: em **Revisar no mapa**,
    baixe o CSV de endereços, importe no My Maps, exporte a camada como KML e
    carregue de volta. As coordenadas ficam guardadas e valem para sempre.
- Tudo que ficou aproximado ou sem localização aparece em **Revisar no mapa**,
  onde um toque no mapa corrige o ponto — e a correção fica salva para sempre.
- **Endereço escrito na descrição.** As OS de infraestrutura vêm com
  `S/END, S/N` no campo de endereço e a rua escrita no texto da ocorrência. A
  ferramenta lê a descrição, extrai a rua e combina com a cidade que veio no
  campo oficial. Nas demais OS, o endereço da descrição serve de segunda
  tentativa quando o oficial não é localizado com precisão — costuma vir melhor
  formatado, às vezes copiado direto do Google Maps.
- **CEP em duas bases.** BrasilAPI primeiro; se ela não tiver a coordenada,
  AwesomeAPI. O CEP também é procurado dentro da descrição quando falta no campo.
- O que sobrar sem localização vai para **Revisar no mapa**, onde um toque
  corrige o ponto — e a correção fica salva para sempre.
- O link de rota do Google Maps aceita no máximo 10 paradas.

---

## Próximo passo

Fazer o AUTOMATO_0807 gerar o arquivo do dia já no formato esperado, para que a
importação seja só arrastar — ou publicar direto num Google Sheets que a página
lê sozinha ao abrir.
