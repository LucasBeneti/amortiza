# amortiza

Comparador de financiamento imobiliário **PRICE x SAC**, escrito em React + Vite.
Todo o cálculo roda no navegador: não há backend. O diferencial do projeto é ser
rígido quanto à convenção de juros — **nominal x efetiva** — para que as
comparações feitas aqui batam com o contrato, não com o anúncio.

> Status: a aplicação web já calcula as parcelas de PRICE e SAC a partir de um
> formulário — entrada de 50% (PRICE) e ~30% (SAC) por padrão, ajustável —
> com resumo comparativo e tabela completa de parcelas. Este README
> documenta sobretudo o modelo de juros que orienta o cálculo.

---

## Juros nominal x efetivo

Essa é a fonte de quase toda confusão em calculadoras de financiamento. Duas
taxas com o **mesmo número** (`11% a.a.`) podem ter custos reais diferentes de
centenas de milhares de reais em um contrato de 35 anos.

### Definições

Seja $i_a$ a taxa **anual** e $i_m$ a taxa **mensal**.

| Taxa        | Definição                                                             | Conversão para a mensal           |
| ----------- | --------------------------------------------------------------------- | --------------------------------- |
| **Nominal** | A porcentagem anunciada, **sem** considerar capitalização intra-anual | $i_m = i_a^{nom} / 12$            |
| **Efetiva** | O custo real do período, **considerando** juros compostos             | $i_m = (1 + i_a^{ef})^{1/12} - 1$ |

A diferença nasce do regime de juros compostos: a cada mês, os juros incidem
sobre o _saldo com juros do mês anterior_. Por isso, 12 aplicações sucessivas de
$i_m$ nunca produzem $12 \cdot i_m$ — produzem:

$$
(1 + i_m)^{12} - 1
$$

Na prática, a mesma taxa anual pode ser cotada em duas bases distintas:

- **Nominal**: a taxa anual é a mensal × 12, e a capitalização "excede" esse
  número quando composta. É a cotação típica de contrato: _"11% a.a.,
  capitalização mensal"_ custa, de fato, 11,57% a.a. efetivos.
- **Efetiva**: a taxa anual já desconta a capitalização. É a taxa usada para
  comparar projetos, para o método contábil da taxa efetiva e por calculadoras
  que assumem juros compostos.

### Tabela de equivalência rápida

A conversão usada é:

$$
i_a^{ef} = \left(1 + \frac{i_a^{nom}}{12}\right)^{12} - 1
$$

| Anual nominal | Anual efetiva equivalente |
| ------------: | ------------------------: |
|        10,00% |                  10,4713% |
|        10,50% |                  11,0203% |
|        11,00% |                  11,5719% |
|        12,00% |                  12,6825% |

Em prazos típicos de financiamento imobiliário (25–35 anos), essa diferença de
base gera **centenas de milhares de reais** de divergência no custo total da
operação.

### Exemplo: 11% nominal x 11% efetiva, na mesa

Imóvel de R$ 650.000, entrada de 50% na PRICE e 30% na SAC, 420 meses (35
anos). Os totais são das **parcelas** (a entrada está fora, pois é o mesmo
dinheiro nos dois critérios):

| Critério                    | Taxa mensal usada | PRICE 1ª parcela | SAC 1ª parcela |     Total PRICE |       Total SAC |
| --------------------------- | ----------------- | ---------------: | -------------: | --------------: | --------------: |
| Nominal `11% ÷ 12`          | 0,9167%           |      R$ 3.045,11 |    R$ 5.254,16 | R$ 1.278.959,01 | R$ 1.332.961,31 |
| Efetiva `(1,11)^(1/12) − 1` | 0,8735%           |      R$ 2.914,29 |    R$ 5.057,57 | R$ 1.224.011,35 | R$ 1.291.578,41 |

Mesma taxa "11%", mesmo imóvel, mesmo prazo. A diferença no total das parcelas
pode superar **R$ 54.000** na PRICE e **R$ 41.000** na SAC — e não é um erro de
arredondamento de centavos: são dois contratos econômicos diferentes. É
exatamente o erro mais frequente ao comparar propostas: usar a taxa mensal do
contrato (nominal ÷ 12) contra taxas mensais de calculadoras que assumem a
efetiva (ou vice-versa).

---

## Na prática dos contratos brasileiros

Quando o contrato (instrumento particular e seus anexos) traz _"taxa de 11%
a.a. capitalizada mensalmente"_, essa taxa é **nominal**: a mensal de referência
é `anual ÷ 12` e a cobrança é feita mês a mês. O número do anúncio subestima o
custo sempre que houver mais de um período de capitalização por ano.

Como distinguir:

- Abra a cláusula de juros e procure a **taxa mensal** de referência.
- Se ela é `anual ÷ 12` → **nominal**.
- Se ela é `(1 + anual)^{1/12} − 1` → **efetiva** (mais rara em contrato, comum
  em comparadores e em noticiários de taxas de mercado).

Um caso clínico que motivou este README: dois números de total divergindo em
~R$ 40–55 mil com o _mesmo_ 11% a.a., o mesmo imóvel e o mesmo prazo. Não havia
erro de código, tampouco de arredondamento: era uma comparação entre a taxa
nominal cobrada pelo contrato e a efetiva usada pelas calculadoras online.

---

## Contabilidade: o método da taxa efetiva de juros

No âmbito da Contabilidade Financeira, o **CPC 48 / IFRS 9** (instrumentos
financeiros mensurados ao **custo amortizado**) determina que a receita/despesa
de juros seja reconhecida pelo **método da taxa efetiva de juros**: a taxa
efetiva é a **TIR** (taxa interna de retorno) dos fluxos de caixa contratuais —
a única que desconta os pagamentos futuros de forma que o valor presente
coincida com o custo inicial do passivo. Ou seja:

$$
V_0 = \sum_{t=1}^{n} \frac{FC_t}{(1 + i^{ef})^{t}}
$$

em que $V_0$ é o valor inicial do passivo no reconhecimento contábil, $FC_t$
são os fluxos de caixa contratados no período $t$ e $i^{ef}$ é a taxa
efetiva de juros — determinada em função dos fluxos, não escolhida à vontade.

Nós usamos a taxa efetiva por ser a **taxa economicamente correta**: ela é a
que faz o saldo devedor convergir a zero ao fim da amortização e é a que
incorpora tarifas e custos acessórios em instrumentos reais. A taxa nominal
existe, mas é um número de cotação: um instrumento que promete 11% **nominal**
ao ano custa, de fato, 11,5719% ao ano **efetivo** — e é esse segundo número
que entra na mensuração contábil e na tomada de decisão financeira.

---

## Fórmulas de conversão (referência rápida)

Com $i_a^{nom}$ a anual nominal, $i_a^{ef}$ a anual efetiva e $i_m$ a mensal:

$$
i_m = \frac{i_a^{nom}}{12}
$$

$$
i_a^{ef} = (1 + i_m)^{12} - 1
$$

$$
i_m = (1 + i_a^{ef})^{1/12} - 1
$$

$$
i_a^{nom} = 12 \cdot i_m
$$

$$
i_a^{nom} = 12 \cdot \big((1 + i_a^{ef})^{1/12} - 1\big)
$$

---

## Erros comuns

- Dividir a taxa **efetiva** anual por 12 (ou o contrário: multiplicar a mensal
  nominal por 12 e tratar o resultado como efetiva).
- Ignorar a base ao comparar propostas de bancos distintos.
- Acreditar que "11% a.a." no material publicitário é o custo real.
- Esquecer que, com amortização gradual, juros compostos podem gerar divergência
  de dezenas de milhares de reais ao longo de 420 meses.

---

## Como rodar

```bash
yarn install
yarn dev      # ambiente de desenvolvimento
yarn build    # build de produção
yarn preview  # servir o build
```

## Deploy na Cloudflare (Workers + static assets)

O app é 100% estático, então é servido como **static assets** de um Worker
(requer Wrangler 4.24+). A configuração está em `wrangler.toml`: aponta o
`./dist` do Vite e ativa `not_found_handling = "single-page-application"`.

Deploy manual:

```bash
yarn deploy            # equivalente a "wrangler deploy"
```

Deploy automático (CI): o workflow `.github/workflows/deploy.yml` roda a cada
push na branch `main` (ou manualmente via `workflow_dispatch`). Ele instala as
dependências, executa `yarn build` e publica com o `cloudflare/wrangler-action`.

Antes do primeiro deploy, configure no GitHub **Settings → Secrets and
variables → Actions** (ou no dashboard da Cloudflare):

| Secret | Valor |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token de API com permissão *Edit Cloudflare Workers* (My Profile → API Tokens → "Edit Cloudflare Workers") |
| `CLOUDFLARE_ACCOUNT_ID` | ID da conta (Dashboard → Workers & Pages → sidebar) |

## Estrutura

```text
amortiza/
├── index.html
├── vite.config.ts
├── wrangler.toml
├── .github/workflows/deploy.yml
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── FinancingForm.tsx
    │   ├── ScenarioSummary.tsx
    │   ├── AmortizationSchedule.tsx
    │   ├── RateOverview.tsx
    │   └── RuleBanner.tsx
    └── lib/
        ├── financing.ts
        ├── input.ts
        └── format.ts
```
