# UI/UX-dokumentasjon

Denne siden dokumenterer hvordan brukergrensesnittet i Solskinn Frisør er planlagt, bygget og forbedret med fokus på enkel booking, tydelig navigasjon og responsivt design.

## Mål

- Gjore det raskt og enkelt for en kunde å bestille time pa nett.
- Presentere tjenester, ansatte og kontaktinformasjon pa en oversiktlig mate.
- Redusere friksjon i bookingflyten ved a dele prosessen opp i sma steg.
- Lage en losning som fungerer godt pa mobil, siden mange brukere bestiller fra telefon.

## Målgruppe

- Kunder som vil booke frisortime uten a ringe salongen.
- Nye besokende som trenger oversikt over tjenester, ansatte og apningstider.
- Ansatte som trenger en enkel internflate for administrasjon.

## Designprosess

Prosjektet inneholder egne mockup-filer som viser tidlig planlegging av struktur, komponenter og bookingflyt:

- `solskinn_frisor_ui_mockup.html`
- `solskinn_frisor_ui_mockup(1).html`
- `solskinn_frisor_ui_mockup(2).html`

Mockupene ble brukt for a avklare:

- hvordan startsiden skulle bygges opp
- hvordan bookingflyten skulle deles inn i steg
- hvilke kort, knapper og informasjonsblokker som trengtes
- hvordan losningen skulle oppfore seg pa mindre skjermer

## Viktige UI-valg

- Varme farger og myke kontraster er brukt for a gi et rolig og vennlig uttrykk.
- Stor hovedknapp for booking er plassert flere steder for a gi en tydelig call to action.
- Tjenester, ansatte og tidspunkter vises som kort eller knapper som kan velges direkte.
- Sammendrag vises underveis i bestillingen slik at brukeren ser valgene sine fortlopende.

## Viktige UX-valg

- Booking er delt inn i fire steg: tjeneste, frisor, dato/tid og kontaktinformasjon.
- Et stegindikatorfelt viser hvor i prosessen brukeren er.
- Ugyldige eller utilgjengelige valg skjules eller deaktiveres i stedet for a gi uklare feil senere.
- Kontaktinformasjon valideres bade i skjemaet og pa serversiden.
- Dobbelbooking kontrolleres pa nytt ved lagring for a unnga konflikter.

## Responsivt design

Losningen er bygget for bade desktop og mobil:

- navigasjonen bytter til hamburgermeny pa sma skjermer
- grids og kolonner brytes ned til enkolonne-layout ved behov
- bookingfeltene er store nok til at de er enkle a trykke pa mobil
- datovelgeren kan scrolles horisontalt nar plassen er begrenset

## Tilgjengelighet

Prosjektet bruker flere enkle tilgjengelighetstiltak:

- korrekt `lang="nb"` og viewport i HTML-head
- skjemaetiketter pa felter i bookingflyten
- `aria-expanded` og `aria-controls` pa mobilmenyen
- synlige fokusmarkeringer for lenker, knapper og valgknapper
- tastaturvennlig lukking av mobilmenyen med `Escape`

## Forbedringer som er gjort

- Tydeligere tastaturfokus for interaktive elementer.
- Bedre mobilmeny som kan lukkes med Escape, ved klikk utenfor og etter valg av lenke.
- Egen dokumentasjon for UI/UX slik at design- og brukerperspektivet er forklart i repoet.

## Videre arbeid

- Brukerteste bookingflyten med 3 til 5 personer.
- Maale hvor mange som avbryter i hvert bookingsteg.
- Vurdere tydeligere feilmeldinger og hjelpetekster i skjemaene.
- Legge til egne tilgjengelighetstester for kontrast og tastaturnavigasjon.