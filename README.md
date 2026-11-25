# theaccuweather: live weather and AQI

A Next.js website showing weather and live air quality (AQI) for cities worldwide, in an
aqi.in-style layout, with a real-colour Earth logo that turns to the visitor's country.

## What's included

| Feature | Where |
|---|---|
| City search with suggestions, plus "use my location" | `src/components/SearchBox.tsx` |
| Big card over a street map: Weather tab first, AQI tab second | `src/components/LiveCard.tsx`, `MapBanner.tsx` |
| AQI standard picker (US / India CPCB / EU) and Lights switch | `ScaleSelect.tsx`, `ThemeToggle.tsx`, `src/lib/aqi.ts` |
| Next 24 hours, 7-day forecast, pollutants, 24-hour AQI graph, health advice | `src/components/CityView.tsx` |
| Country, state and city pages for 31,799 cities | `src/app/country/...`, `src/app/city/...`, `src/lib/places.ts` |
| Ranking of 40 major cities | `src/app/ranking/page.tsx` |
| Globe logo that turns to the visitor's country or the city being viewed | `GlobeLogo.tsx`, `GlobeFocus.tsx` |
| Sitemap split into files, breadcrumbs with structured data | `src/app/sitemap.ts`, `src/app/sitemap-index.xml`, `Breadcrumbs.tsx` |

## Country, state and city pages

| Page | Address | Live data |
|---|---|---|
| All countries | `/country` | none |
| A country | `/country/in` | weather + AQI for its 6 biggest cities, every 6 hours |
| A state or region | `/country/in/haryana` | none (links to its cities) |
| A city | `/city/1270022/hisar` | full weather + AQI; hourly for 1M+ cities, else every 3 hours |

- 31,799 cities (GeoNames, population over 15,000) in `src/data/places.ts`, read by `src/lib/places.ts`.
- Pages are built on their first visit and then cached, so deploys use no API calls for them.
- Sitemap: `/sitemap-index.xml` lists `/sitemap/0.xml` (countries and states) and `/sitemap/1.xml`… (cities).

## How the data flows

```
Browser -> Vercel (Next.js) -> Open-Meteo forecast / air-quality / geocoding APIs
               |
               +-> responses cached for 1–6 hours, so many visitors share one API call
```

No API keys are needed. Every call happens on the server (`src/lib/api/*`).

**API budget:** Open-Meteo's free plan allows fewer than 10,000 calls a day, and a request with
more than 10 variables counts as more than one call. Each request here uses 10 or fewer
variables. If the limit is hit, pages keep showing their last good version instead of an error.

## Run it on your computer

```bash
npm install
npm run dev
```
Then open http://localhost:3000.

## Notes

- **Licences:** Open-Meteo is free for non-commercial use with credit (CC BY 4.0). GeoNames is
  CC BY 4.0. Map tiles are © OpenStreetMap contributors. Credits are in the footer and About page.
- **India AQI** is estimated from 24-hour averages of model data, so it can differ from CPCB stations.
- **Name:** the site says it is "Not affiliated with AccuWeather, Inc." in the footer and About page.
- **Globe image:** `public/earth-2k.jpg` is NASA Blue Marble (public domain).
