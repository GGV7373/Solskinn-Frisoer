# Solskinn Frisør

Solskinn Frisør er din lokale frisør her i Trøndelag. Dette er bestillings- og administrasjonssystemet for salongen, bygget med Node.js, Express, EJS og PostgreSQL.

---

## Innholdsfortegnelse

- [Teknisk stack](#teknisk-stack)
- [Forutsetninger](#forutsetninger)
- [Miljøvariabler](#miljøvariabler)
- [Kjøre prosjektet](#kjøre-prosjektet)
- [Nyttige kommandoer](#nyttige-kommandoer)
- [Databasehåndtering](#databasehåndtering)
- [Produksjon](#produksjon)
- [Sikkerhetsliste](#sikkerhetsliste)

---

## Teknisk stack

- **Runtime:** Node.js 20
- **Rammeverk:** Express 5
- **Mal-motor:** EJS
- **Database:** PostgreSQL 16
- **Sesjonslagring:** connect-pg-simple (sesjoner lagres i PostgreSQL)
- **Containerisering:** Docker + Docker Compose

---

## Forutsetninger

Installer følgende før du starter:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (inkluderer Docker Compose)
- [Git](https://git-scm.com/downloads)

Docker Desktop fungerer på Windows 11 og Linux.

---

## Miljøvariabler

Kopier eksempelfilen og fyll inn verdiene dine:

```
cp .env.example .env
```

Rediger `.env` og sett følgende:

| Variabel         | Beskrivelse                                                        | Eksempelverdi                                       |
|------------------|--------------------------------------------------------------------|-----------------------------------------------------|
| `DATABASE_URL`   | Full PostgreSQL-tilkoblingsstreng                                  | `postgres://solskinn:passord@db:5432/solskinn`      |
| `SESSION_SECRET` | Tilfeldig streng brukt til å signere sesjons-cookies (min 32 tegn) | En lang tilfeldig tekst                             |
| `PORT`           | Porten applikasjonen lytter pa                                     | `3000`                                              |
| `NODE_ENV`       | Miljo for applikasjonen                                            | `development` eller `production`                    |

Ikke legg `.env` inn i versjonskontroll. Filen er allerede ekskludert i `.gitignore`.

---

## Kjøre prosjektet

**Steg 1 - Klon repositoriet**

```
git clone https://github.com/GGV7373/Solskinn-Frisoer.git
cd Solskinn-Frisoer
```

**Steg 2 - Sett opp miljøvariabler**

```
cp .env.example .env
```

Rediger `.env` med ønskede verdier.

**Steg 3 - Start prosjektet**

Åpne en terminal i prosjektmappen og kjør:

```
docker compose up -d
```

Docker laster ned nødvendige avhengigheter, bygger applikasjonen og starter både databasen og webserveren. Databaseskjema og seed-data kjøres automatisk ved første oppstart.

Applikasjonen er tilgjengelig på `http://localhost:3000`.

---

## Nyttige kommandoer

Følg med på logger:

```
docker compose logs -f app
```

Sjekk status på kjørende tjenester:

```
docker compose ps
```

Stopp alle tjenester:

```
docker compose down
```

Stopp og slett alle data inkludert databasen:

```
docker compose down -v
```

Bygg på nytt etter kodeendringer:

```
docker compose up -d --build
```

---

## Databasehåndtering

Ta sikkerhetskopi av databasen:

```
docker compose exec db pg_dump -U solskinn solskinn > sikkerhetskopi.sql
```

Gjenopprett en sikkerhetskopi:

```
cat sikkerhetskopi.sql | docker compose exec -T db psql -U solskinn -d solskinn
```

Åpne databaseskallet direkte:

```
docker compose exec db psql -U solskinn -d solskinn
```

---

## Produksjon

For produksjon gjøres følgende endringer i `docker-compose.yml` og `.env` før oppstart:

1. Sett `NODE_ENV` til `production`.
2. Bytt ut `SESSION_SECRET` med en lang, tilfeldig generert streng.
3. Bytt ut databasepassordet fra standard `solskinn_pw` til et sterkt passord. Oppdater det samme passordet begge steder det forekommer i `docker-compose.yml` (`POSTGRES_PASSWORD` og `DATABASE_URL`).
4. Fjern volummonteringen `- .:/app` fra `app`-tjenesten slik at imaget er selvstendig.
5. Kommenter ut eller fjern `ports`-blokken under `db`-tjenesten slik at databaseporten ikke er eksponert offentlig.

Deretter kjøres:

```
docker compose up -d --build
```

Tjenestene er konfigurert med `restart: unless-stopped` og starter automatisk opp igjen etter en omstart av maskinen.

---

## Sikkerhetsliste

Kontroller følgende før du gar live:

- [ ] `NODE_ENV` er satt til `production`
- [ ] `SESSION_SECRET` er en tilfeldig generert streng pa minst 32 tegn og er ikke standardverdien
- [ ] Databasepassordet er sterkt og ikke standard `solskinn_pw`
- [ ] `.env` er ikke lagt inn i repositoriet
- [ ] Databaseporten 5432 er ikke eksponert offentlig
- [ ] Brannmuren pa serveren eksponerer kun portene 80 og 443 mot internett
- [ ] HTTPS er satt opp foran applikasjonen
- [ ] Regelmessige sikkerhetskopier av databasen er planlagt
