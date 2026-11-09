# Vila Nova Digital

Portal municipal demonstrativo para serviços digitais, participação cidadã e
transparência orçamental.

## Estrutura

- `index.html` — página inicial e fluxos de ocorrências, requerimentos e apoios.
- `pages/` — páginas públicas e área administrativa do portal. A página inicial
  permanece na raiz para manter o endereço principal simples.
- `assets/css/` — estilos globais e melhorias de acessibilidade/tema.
- `assets/js/` — lógica do portal público e da área administrativa.
- `supabase/` — schema, migrações e configuração futura da base de dados.
- `manifest.webmanifest`, `sw.js` e `pages/offline.html` — funcionalidades PWA.

## Executar localmente

O Service Worker e os módulos de mapa precisam de HTTP. Na pasta do projeto,
inicie um servidor estático, por exemplo:

```powershell
python -m http.server 5500
```

Depois abra `http://localhost:5500`.

Sem ligação ao Supabase, o portal funciona em modo demonstração e guarda
ocorrências localmente no navegador. A integração real pode ser configurada
mais tarde seguindo [`supabase/README.md`](./supabase/README.md).

## Organização e segurança

- Não colocar chaves `service_role` no frontend.
- Preencher `supabase/config.js` apenas quando a integração for necessária.
- Manter `supabase/config.example.js` como modelo partilhável.
- Fazer uma atualização forçada (`Ctrl+F5`) depois de alterações ao PWA para
  obter a versão mais recente do cache.
