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

Na primeira vez a ferramenta pergunta quais colunas da planilha correspondem a
endereço, cliente, número da OS etc. Ela detecta a maioria sozinha e guarda a
escolha — nos dias seguintes é só soltar o arquivo.

### Regras configuráveis

- **O que conta como repetição:** mesmo endereço (padrão), mesmo cliente ou mesmo contrato.
- **Janela:** 7, 15 ou 30 dias.
- **Níveis:** 2 ocorrências = alerta (âmbar). 3 ou mais = crítico (vermelho, com halo no mapa).
- **Ponto de partida:** marque a sede no mapa para que as rotas comecem dela.

### Salve a base de vez em quando

O botão **Salvar base** baixa um `.json` com o histórico dos dias e os endereços
já localizados. É o que permite reconstruir tudo em outro computador ou depois de
limpar o navegador. Guarde no Drive junto com os outros arquivos do setor.

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
- Para descobrir as coordenadas, o endereço em texto é consultado no
  [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap). Vai o
  endereço, nada mais: sem nome de cliente, sem número de OS, sem contrato.
  Cada endereço é consultado **uma única vez** — depois fica em cache.
- Se a política interna não permitir nem isso, inclua colunas `Latitude` e
  `Longitude` na planilha: a ferramenta usa direto e não consulta nada externo.

O repositório é público, mas contém apenas código e a planilha fictícia de
exemplo em `exemplo/os-exemplo.csv`. Nenhum dado real de cliente entra no Git.

---

## Limites conhecidos

- O serviço de endereços aceita 1 consulta por segundo. Um dia novo com 80 OS
  leva cerca de 90 segundos na primeira carga; nos dias seguintes é imediato,
  porque os endereços repetidos já estão em cache.
- Endereços incompletos ou com quadra/lote fora do padrão podem não ser
  encontrados. Eles aparecem em **Sem localização** e você marca o ponto no mapa
  com um toque — a posição fica salva para as próximas vezes.
- O link de rota do Google Maps aceita no máximo 10 paradas.

---

## Próximo passo

Fazer o AUTOMATO_0807 gerar o arquivo do dia já no formato esperado, para que a
importação seja só arrastar — ou publicar direto num Google Sheets que a página
lê sozinha ao abrir.
