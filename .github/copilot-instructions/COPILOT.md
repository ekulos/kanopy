# Kyoma — Istruzioni per GitHub Copilot

Questo file istruisce Copilot su architettura, convenzioni e regole del progetto **Kyoma**.
Leggilo sempre prima di generare codice nuovo o modificare quello esistente.

---

## Stack tecnologico

| Layer | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth | NextAuth.js v5 (beta) con GitHub provider |
| ORM | Prisma + SQLite (dev) / PostgreSQL (prod) |
| UI | React 18 + Tailwind CSS v3 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Validazione | Zod |
| State | React state locale + Zustand (dove necessario) |
| Markdown editor | @uiw/react-md-editor |
| CSV | papaparse |
| Toast | react-hot-toast |
| Date | date-fns (locale `it`) |
| Language | TypeScript strict |

---

## Struttura cartelle

```
src/
├── app/
│   ├── (app)/                      # Layout autenticato (sidebar)
│   │   ├── layout.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx            # Lista progetti
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Kanban/Lista task
│   │   │       ├── import/page.tsx # Import CSV (contestuale al progetto)
│   │   │       └── tasks/[taskId]/page.tsx  # Dettaglio task
│   │   ├── my-tasks/
│   │   │   └── page.tsx            # Task assegnati all'utente corrente
│   │   └── deadlines/
│   │       └── page.tsx            # Task con scadenza, raggruppati per fascia temporale
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── projects/route.ts       # GET list, POST create
│   │   ├── projects/[id]/route.ts  # GET, PATCH, DELETE
│   │   ├── tasks/route.ts          # GET list, POST create
│   │   ├── tasks/[id]/route.ts     # GET, PATCH, DELETE
│   │   ├── tasks/comments/route.ts # POST comment
│   │   ├── csv-import/route.ts     # POST import
│   │   ├── users/route.ts          # GET lista utenti (search con ?q=)
│   │   ├── teams/route.ts          # GET lista team, POST crea team
│   │   └── teams/[id]/route.ts     # GET, PATCH, DELETE
│   │   └── teams/[id]/members/route.ts  # POST aggiungi membro, DELETE rimuovi
│   ├── login/page.tsx
│   ├── layout.tsx                  # Root layout
│   └── globals.css
├── components/
│   ├── ui/Sidebar.tsx
│   ├── kanban/KanbanBoard.tsx
│   ├── kanban/KanbanColumn.tsx
│   ├── tasks/TaskCard.tsx
│   ├── tasks/TaskDetailMain.tsx
│   ├── tasks/TaskDetailPanel.tsx   # Pannello collassabile
│   ├── tasks/TaskDetailTopbar.tsx
│   ├── tasks/TaskList.tsx
│   ├── tasks/SubtaskList.tsx
│   ├── tasks/CommentThread.tsx
│   ├── projects/ProjectsTopbar.tsx
│   ├── projects/ProjectsTable.tsx
│   ├── projects/ProjectDetailTopbar.tsx
│   ├── projects/ProjectMetaBar.tsx
│   └── csv/CsvImportPanel.tsx
│   └── csv/CsvImportTopbar.tsx
├── hooks/
│   └── useSidebarProjects.ts
├── lib/
│   ├── auth.ts                     # NextAuth config (con JWT strategy)
│   ├── auth.config.ts              # NextAuth config senza adapter (usata dal middleware)
│   ├── prisma.ts                   # Singleton Prisma client
│   └── utils.ts                    # cn(), formatDueDate(), STATUS_LABELS, ecc.
├── types/
│   └── index.ts                    # Tutti i tipi TypeScript
└── middleware.ts                   # Protezione route (usa auth.config, no Prisma)
```

---

## Convenzioni di codice

### Componenti
- **Server Components** per pagine (`app/`) dove non serve interattività
- **`"use client"`** solo quando necessario (useState, useEffect, event handlers, dnd-kit)
- Props tipizzate sempre con interfacce esplicite
- Nessun `any` — usare i tipi in `src/types/index.ts`

### API Routes
- Ogni route autentica con `const session = await auth()` prima di qualsiasi query
- Validare input con **Zod** — non fidarsi mai del body grezzo
- Restituire sempre `{ data: ... }` per successo, `{ error: ... }` per errore
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found

### Prisma
- Non istanziare `new PrismaClient()` nei componenti — usare sempre `import { prisma } from "@/lib/prisma"`
- Le query includono solo i campi necessari (`select` o `include` espliciti)
- Per relazioni molti-a-molti (assignees, labels) usare `deleteMany` + `createMany` per l'aggiornamento

### Styling
- Solo classi **Tailwind** — nessun CSS inline o moduli CSS
- Palette accent: `bg-accent` (`#7c5cbf`), `text-accent`, `border-accent`
- Sidebar background: `bg-[#16213e]`
- Bordi: `border-gray-100` o `border-gray-200`
- Testo muted: `text-gray-400`

### Navigazione (importante)
- La voce **"Import CSV"** nella sidebar appare **solo** quando si è dentro un progetto specifico (`/projects/[id]/...`)
- La sidebar rileva il progetto corrente dal pathname con regex `/\/projects\/([^\/]+)/`
- I link ai progetti usano `project.code ?? project.id` — sempre preferire il `code`

---

## Modello dati (Prisma)

Vedi `prisma/schema.prisma` per lo schema completo. Entità principali:

- **User** → autenticato via NextAuth (GitHub)
- **Team** → gruppo di utenti; i progetti appartengono opzionalmente a un team
- **Project** → ha `ownerId`, `color`, `status`, **`code`** (identificativo breve univoco es. `WEB`); contiene Task
- **Task** → ha `status` (todo/in_progress/done), `priority`, `parentId` per i sotto-task, `position` per ordinamento kanban, **`ticketNumber`** (numero progressivo per progetto, es. `WEB-1`)
- **TaskAssignee** → join table Task ↔ User (assegnazione multipla)
- **Comment** → appartiene a Task, ha `authorId`
- **Activity** → log eventi (cambio stato, commenti, ecc.)

### URL dei progetti

I percorsi usano `project.code` invece di `project.id`:
- Lista: `/projects`
- Dettaglio Kanban/Lista: `/projects/WEB`
- Dettaglio task: `/projects/WEB/tasks/[taskId]`
- Import CSV: `/projects/WEB/import`

Le route `[id]` fanno lookup con `OR: [{ code: id }, { id }]` — i link vecchi per id funzionano ancora.

---

## Regole specifiche per feature

### Kanban
- Il drag & drop usa `@dnd-kit/core` — vedere `KanbanBoard.tsx` e `KanbanColumn.tsx`
- Ogni colonna è un `useDroppable` con `id = TaskStatus`
- Ogni card è un `useSortable` con `id = task.id`
- Dopo il drop: **ottimistic update** in locale → PATCH `/api/tasks/:id` → rollback su errore

### Sotto-task
- Un sotto-task è un `Task` con `parentId !== null`
- La lista progetti mostra solo task root (`parentId: null`)
- Il dettaglio task mostra i sotto-task nel componente `SubtaskList`
- Il toggling dello stato di un sotto-task fa una PATCH e aggiorna la progress bar
- Ogni sotto-task è **espandibile** con chevron e click sul titolo — mostra descrizione (markdown), priorità, scadenza, assegnatari, data creazione
- I sotto-task hanno un editor Markdown per la descrizione (nella form di creazione e nella vista espansa)

### Markdown editor
- Usare `MarkdownEditor` e `MarkdownPreview` da `@/components/ui/MarkdownEditor`
- Entrambi sono `dynamic` import (`ssr: false`) per evitare crash SSR
- Pattern click-to-edit: in modalità view mostrare `MarkdownPreview`, al click passare a `MarkdownEditor`
- Salvare description via PATCH API, ricaricare con `router.refresh()`

### Ticket ID
- Ogni task ha un `ticketNumber` progressivo per progetto (es. task 1 del progetto `WEB` → `WEB-1`)
- L'auto-incremento avviene nel POST `/api/tasks`: cerca il max `ticketNumber` nel progetto, aggiunge 1
- Mostrare il ticket ID come `{project.code}-{task.ticketNumber}` (es. `WEB-1`)

### Lista task (TaskList.tsx)
- Componente **client** con selezione multipla tramite checkbox
- Stato selezione: `const [selected, setSelected] = useState<Set<string>>(new Set())`
- Toolbar di selezione appare in alto con contatore e pulsante "Elimina selezionati"
- Cancellazione bulk via `DELETE /api/tasks` con `{ ids: string[] }` — modale di conferma con lista nomi e conteggio sotto-task

### Eliminazione progetti (ProjectsTable.tsx)
- Icona cestino visibile al hover su ogni riga
- Al click: fetch lazy di `/api/projects/[id]` per contare task e sotto-task
- Modale di conferma con breakdown: task root / sotto-task / totale — warning azione irreversibile
- Dopo eliminazione: rimozione ottimistica dal state locale + `router.refresh()`

### Aggiornamento lista dopo creazione progetto
- `ProjectsView` mantiene i progetti in state locale (`useState<Project[]>(initialProjects)`)
- `ProjectsTopbar` riceve `onProjectCreated?: (project: Project) => void`
- Dopo la creazione, il nuovo progetto viene prepended allo state locale istantaneamente — nessun refresh visivo necessario
- Il pannello CSV è disponibile **solo** navigando a `/projects/[id]/import`
- Il parsing avviene client-side con `papaparse` (nessun upload file al server)
- Il server riceve `{ projectId, rows[] }` via POST `/api/csv-import`
- Le colonne supportate: `titolo` (req), `descrizione`, `stato`, `priorità`, `scadenza`, `assegnatari`
- Gli assegnatari si risolvono per email — utenti non trovati vengono ignorati silenziosamente
- Le righe con errori vengono saltate e riportate nel risultato

### Pannello dettaglio task
- Il pannello laterale destro è collassabile (`TaskDetailPanel.tsx`)
- Lo stato del pannello è locale (`useState`) — non persistito
- Il cambio di status/priorità dal pannello fa immediatamente una PATCH API

---

## Come aggiungere funzionalità

### Nuovo provider OAuth
1. Installare il pacchetto provider (`next-auth/providers/google`)
2. Aggiungere in `src/lib/auth.ts` array `providers`
3. Aggiungere le env vars in `.env.example`

### Nuovo campo su Task
1. Aggiungere il campo in `prisma/schema.prisma`
2. Eseguire `npm run db:push` (dev) o `npm run db:migrate` (prod)
3. Eseguire `npx prisma generate` per rigenerare il client
4. Aggiornare `src/types/index.ts` (interfaccia `Task`)
5. Aggiornare Zod schema in `src/app/api/tasks/route.ts` e `[id]/route.ts`
6. Aggiornare il componente `TaskDetailPanel.tsx` per mostrarlo

### Nuova vista (es. Gantt)
1. Aggiungere il tab in `ProjectDetailTopbar.tsx`
2. Creare il componente in `src/components/`
3. Renderizzarlo condizionalmente in `src/app/(app)/projects/[id]/page.tsx`

---

## Script utili

```bash
npm run dev          # Avvia dev server
npm run db:push      # Sincronizza schema senza migration
npm run db:migrate   # Crea migration e applica
npm run db:studio    # Apri Prisma Studio
npm run db:seed      # Inserisci dati demo
npm run build        # Build produzione
```

---

## Variabili d'ambiente richieste

Copiare `.env.example` → `.env.local` e compilare:

```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```
