# Solskinn Frisør

Solskinn Frisør er et bestillings- og administrasjonssystem for en frisørsalong. Løsningen er bygget med Node.js, Express, EJS og PostgreSQL, og gir både en offentlig kundeopplevelse for timebestilling og en intern administrasjonsflate for ansatte.

## Innholdsfortegnelse

- [Oversikt](#oversikt)
- [Funksjoner](#funksjoner)
- [UI/UX og designvalg](#uiux-og-designvalg)
- [Teknisk stack](#teknisk-stack)
- [Prosjektstruktur](#prosjektstruktur)
- [Forutsetninger](#forutsetninger)
- [Hurtigstart med Docker](#hurtigstart-med-docker)
- [Kjore applikasjonen utenfor Docker](#kjore-applikasjonen-utenfor-docker)
- [Miljøvariabler](#miljovariabler)
- [Standarddata og admininnlogging](#standarddata-og-admininnlogging)
- [Bestillingsflyt](#bestillingsflyt)
- [Administrasjonsflate](#administrasjonsflate)
- [Databaseoversikt](#databaseoversikt)
- [Nyttige kommandoer](#nyttige-kommandoer)
- [Databasehåndtering](#databasehåndtering)
- [Feilsøking](#feilsoking)
- [Produksjon](#produksjon)
- [Sikkerhetsliste](#sikkerhetsliste)

## Oversikt

Applikasjonen består av to hoveddeler:

- En offentlig nettside med informasjon om salongen, tjenester og åpningstider.
- En firestegs bookingflyt der kunden velger tjeneste, frisør, dato/tid og kontaktinformasjon.
- En adminflate for å se bestillinger, administrere ansatte, oppdatere tjenester og vedlikeholde arbeidsplaner.

Prosjektet er satt opp for enkel lokal kjøring med Docker Compose. Ved oppstart initialiseres databasen automatisk med skjema og eksempeldata.

## Funksjoner

Dette prosjektet støtter blant annet:

- Visning av tjenester og åpningstider for kunder.
- Booking av time i flere steg med sesjonsbasert progresjon.
- Beregning av ledige timer basert på varighet, arbeidsplan og eksisterende bestillinger.
- Beskyttelse mot dobbeltbooking både i applikasjonslogikk og via unik indeks i databasen.
- Bekreftelsesside med bookingkode etter fullført bestilling.
- Admininnlogging med passordbeskyttet område.
- Oversikt over kommende og aktive bestillinger.
- Oppretting, redigering og deaktivering av ansatte.
- Oppretting, redigering og deaktivering av tjenester.
- Vedlikehold av ukentlig arbeidsplan per ansatt.

## UI/UX og designvalg

Prosjektet har en egen UI/UX-dokumentasjon i `docs/ux-ui.md` som beskriver mal, designvalg, bookingflyt, responsiv tilpasning og enkle tilgjengelighetstiltak.

I tillegg ligger det mockup-filer i rotmappen som viser tidlig planlegging av grensesnitt og navigasjon.

## Teknisk stack

- Runtime: Node.js 20
- Rammeverk: Express 5
- Malmotor: EJS
- Database: PostgreSQL 16
- Sesjonslagring: `express-session` + `connect-pg-simple`
- Containerisering: Docker + Docker Compose

## Prosjektstruktur

De viktigste mappene og filene:

- `index.js`: oppretter Express-applikasjonen, konfigurerer sessions og starter serveren.
- `routes/`: ruteoppsett for offentlig side, booking og admin.
- `controllers/`: applikasjonslogikk for visninger, booking og administrasjon.
- `views/`: EJS-maler for kunde- og adminflater.
- `public/`: statiske filer som CSS og bilder.
- `docs/ux-ui.md`: dokumentasjon av UI/UX, designvalg og brukerflyt.
- `db/schema.sql`: databaseskjema.
- `db/seed.sql`: eksempeldata som legges inn ved oppstart.
- `docker-compose.yml`: lokal utviklingsstack med app og PostgreSQL.
- `.env.example`: eksempel på miljøvariabler ved lokal kjøring utenfor Docker eller ved tilpasning av deploy-oppsett.

## Forutsetninger

Installer følgende før du starter:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) med Docker Compose
- [Git](https://git-scm.com/downloads)

Hvis du vil kjøre Node.js-appen direkte uten Docker, trenger du også:

- Node.js 20
- PostgreSQL 16

## Hurtigstart med Docker

Dette er anbefalt måte å kjøre prosjektet lokalt på.

### 1. Klon repositoriet

```bash
git clone https://github.com/GGV7373/Solskinn-Frisoer.git
cd Solskinn-Frisoer
```

### 2. Start stacken

```bash
docker compose up -d --build
```

Dette gjør følgende:

- bygger Node.js-applikasjonen fra `Dockerfile`
- starter PostgreSQL 16 i egen container
- oppretter databaseskjema fra `db/schema.sql`
- legger inn eksempeldata fra `db/seed.sql`
- starter webapplikasjonen på port 3000

Applikasjonen blir tilgjengelig på `http://localhost:3000`.

### 3. Stopp tjenestene

```bash
docker compose down
```

Hvis du også vil slette databasedata lokalt:

```bash
docker compose down -v
```

### Viktig om miljøvariabler i Docker-oppsettet

Den nåværende `docker-compose.yml`-filen inneholder lokale standardverdier direkte i konfigurasjonen. Det betyr at `docker compose up` fungerer uten en `.env`-fil, men det betyr også at endringer i `.env` ikke automatisk påvirker containerne med mindre du oppdaterer `docker-compose.yml` til å lese disse verdiene.

## Kjore applikasjonen utenfor Docker

Hvis du ønsker å kjøre appen direkte på maskinen din, kan du gjøre det mot en lokal PostgreSQL-instans.

### 1. Installer avhengigheter

```bash
npm install
```

### 2. Opprett miljøfil

På Linux/macOS:

```bash
cp .env.example .env
```

På PowerShell:

```powershell
Copy-Item .env.example .env
```

### 3. Oppdater `.env`

Sett minst `DATABASE_URL`, `SESSION_SECRET` og `ADMIN_PASSWORD`.

### 4. Start applikasjonen

```bash
npm start
```

Ved direkte kjøring vil appen forsøke å kjøre både `db/schema.sql` og `db/seed.sql` ved oppstart. Skjemaet bruker `IF NOT EXISTS`, og seed-data bruker `ON CONFLICT DO NOTHING`, så en tom database kan initialiseres automatisk.

## Miljovariabler

Følgende variabler brukes av applikasjonen:

| Variabel | Påkrevd | Beskrivelse | Eksempel |
|----------|---------|-------------|----------|
| `DATABASE_URL` | Ja | Tilkoblingsstreng til PostgreSQL | `postgres://solskinn:passord@localhost:5432/solskinn` |
| `SESSION_SECRET` | Ja | Hemmelig streng brukt til å signere sesjonscookies | `minst_32_tegn_lang_tilfeldig_streng` |
| `PORT` | Nei | Port Express-serveren lytter på | `3000` |
| `NODE_ENV` | Nei | Miljø for applikasjonen. Styrer blant annet SSL-oppsett mot databasen | `development` eller `production` |
| `ADMIN_PASSWORD` | Anbefalt | Passord for admininnlogging. Hvis den mangler brukes standardverdien `admin` | `sterkt_admin_passord` |

Ikke legg `.env` inn i versjonskontroll. Filen er ekskludert i `.gitignore`.

## Standarddata og admininnlogging

Ved første oppstart legges det inn eksempeldata i databasen:

- 4 ansatte
- standard arbeidsplaner for ukedager
- 3 tjenester

Adminområdet finnes på `http://localhost:3000/admin/login`.

Standard oppførsel for innlogging:

- hvis `ADMIN_PASSWORD` er satt, brukes den verdien
- hvis `ADMIN_PASSWORD` ikke er satt, brukes `admin`

For lokal demo er dette praktisk. For alt annet må passordet endres.

## Bestillingsflyt

Bookingløpet er delt i fire steg under `/booking`:

1. Kunden velger tjeneste.
2. Kunden velger frisør.
3. Kunden velger dato og ledig tidspunkt.
4. Kunden fyller inn navn, telefon og eventuelt e-post.

Viktige detaljer i flyten:

- Stegene lagres i session, slik at brukeren føres videre i riktig rekkefølge.
- Ledige tider beregnes i 15-minutters intervaller.
- Kun dager der valgt frisør faktisk jobber vises i datovelgeren.
- Dagens tider filtreres slik at svært nære tidspunkt ikke tilbys.
- Ved lagring av bestilling gjøres en ekstra konfliktkontroll i database-transaksjon.
- Hver booking får en kode på formatet `SOL-1234`.

## Administrasjonsflate

Adminområdet ligger under `/admin` og krever innlogging.

Følgende sider er tilgjengelige:

- `dashboard`: nøkkeltall for dagens, ukens og totale bestillinger samt kommende timer
- `bestillinger`: filtrering og avlysning av bestillinger
- `arbeidsplan`: redigering av ukentlige arbeidstider per ansatt
- `ansatte`: oppretting, oppdatering og deaktivering av ansatte
- `tjenester`: oppretting, oppdatering og deaktivering av tjenester

Merk at sletting av ansatte og tjenester i praksis håndteres som deaktivering i applikasjonen, slik at historiske data bevares bedre.

## Databaseoversikt

Datamodellen består hovedsakelig av disse tabellene:

- `workers`: ansatte i salongen
- `worker_schedules`: ukentlig arbeidsplan per ansatt
- `worker_exceptions`: avvik som ferie, fridager eller spesialåpning
- `services`: tjenester som kan bestilles
- `bookings`: kundebestillinger
- `session`: session-lagring for innloggede adminbrukere og bookingflyt

Databasen beskytter også mot dobbeltbooking med en unik indeks på kombinasjonen av ansatt, dato og starttid for aktive bookinger.

## Nyttige kommandoer

Se logger fra appen:

```bash
docker compose logs -f app
```

Se logger fra databasen:

```bash
docker compose logs -f db
```

Sjekk status på tjenester:

```bash
docker compose ps
```

Bygg og start på nytt:

```bash
docker compose up -d --build
```

Installer Node-avhengigheter lokalt:

```bash
npm install
```

Start appen uten Docker:

```bash
npm start
```

## Feilsoking

Vanlige problemer og hva du bør sjekke:

### Appen starter ikke

- kontroller at Docker Desktop faktisk kjører
- kjør `docker compose ps` og se om `db` er healthy
- sjekk apploggene med `docker compose logs app`

### Databasetilkoblingen feiler

- verifiser at `DATABASE_URL` peker til riktig vert, port, database, bruker og passord
- ved lokal Node-kjøring mot Docker-database skal vert som regel være `localhost`
- ved kjøring inne i Docker Compose skal databasen nås som `db`

### Bookingtider vises ikke

- kontroller at valgt ansatt har arbeidsplan i `worker_schedules`
- sjekk at tjenesten er aktiv
- sjekk at det finnes fremtidige arbeidsdager innenfor 21-dagersvinduet

### Admininnlogging fungerer ikke

- kontroller om `ADMIN_PASSWORD` er satt i miljøet
- hvis den ikke er satt, prøv standardverdien `admin`
- husk å restarte appen etter endring av miljøvariabler

## Produksjon

Prosjektet kan kjøres i produksjon, men den medfølgende `docker-compose.yml`-filen er tydelig innrettet mot lokal utvikling og demo. Før produksjonsbruk bør du minst gjøre følgende:

1. Flytt hemmeligheter ut av `docker-compose.yml` og inn i sikre miljøvariabler eller secrets.
2. Sett `NODE_ENV=production`.
3. Bytt ut `SESSION_SECRET` med en lang, tilfeldig generert streng.
4. Sett et sterkt `ADMIN_PASSWORD`.
5. Bytt databasepassordet fra standardverdien `solskinn_pw`.
6. Fjern volummonteringen `.:/app` slik at containeren kjører et immutabelt image.
7. Ikke eksponer PostgreSQL-porten offentlig.
8. Plasser applikasjonen bak HTTPS og gjerne en reverse proxy.

Start deretter opp igjen med:

```bash
docker compose up -d --build
```

## Sikkerhetsliste

Kontroller følgende før du går live:

- [ ] `NODE_ENV` er satt til `production`
- [ ] `SESSION_SECRET` er tilfeldig generert og minst 32 tegn lang
- [ ] `ADMIN_PASSWORD` er satt og er ikke standardverdien
- [ ] Databasepassordet er sterkt og ikke `solskinn_pw`
- [ ] Hemmeligheter ligger ikke hardkodet i `docker-compose.yml`
- [ ] `.env` er ikke sjekket inn i repositoriet
- [ ] Databaseport 5432 er ikke eksponert offentlig
- [ ] HTTPS er satt opp foran applikasjonen
- [ ] Regelmessige sikkerhetskopier av databasen er planlagt

## Databasehåndtering

Ta sikkerhetskopi av databasen:

```bash
docker compose exec db pg_dump -U solskinn solskinn > sikkerhetskopi.sql
```

Gjenopprett en sikkerhetskopi:

```bash
cat sikkerhetskopi.sql | docker compose exec -T db psql -U solskinn -d solskinn
```

Åpne databaseskallet direkte:

```bash
docker compose exec db psql -U solskinn -d solskinn
```
