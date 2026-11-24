# theaccuweather: live AQI and weather (Phase 0 + 1)

A Next.js website showing live air quality (AQI) and weather for any city in the world,
in an aqi.in-style layout, with a real-colour Earth logo that turns to the visitor's country.

## What's included

| Feature | Where |
|---|---|
| City search with suggestions, plus "use my location" | `src/components/SearchBox.tsx` |
| Live AQI card with US / India (CPCB) / EU scale switch | `src/components/LiveCard.tsx`, `src/lib/aqi.ts` |
| Current weather: temp, feels like, humidity, wind, UV, visibility, pressure, sunrise | `LiveCard.tsx` |
| Six pollutant cards (PM2.5, PM10, NO2, O3, SO2, CO) | `PollutantGrid.tsx` |
| 24-hour AQI graph with min / max | `AqiHistoryChart.tsx` |
| Next 24 hours strip and 7-day table with daily peak AQI | `HourlyStrip.tsx`, `DailyForecast.tsx` |
| Health advice for the current AQI level | `CityView.tsx` |
| Home page: your location, most polluted and cleanest major cities | `src/app/page.tsx`, `HomeLocal.tsx` |
| Ranking of 40 major cities | `src/app/ranking/page.tsx` |
| Globe logo that spins to the visitor's country or the city being viewed | `GlobeLogo.tsx`, `GlobeFocus.tsx` |
| SEO basics: one URL per city, page titles, sitemap, robots | `src/app/city/...`, `sitemap.ts`, `robots.ts` |
| Loading skeletons and friendly error messages | `loading.tsx`, `error.tsx`, `ErrorPanel.tsx` |

City pages look like `/city/1261481/new-delhi` (the number is the GeoNames id).

## How the data flows

```
Browser -> Vercel (Next.js) -> Open-Meteo forecast / air-quality / geocoding APIs
               |
               +-> responses cached for 15 minutes, so 1,000 visitors to Delhi = 1 API call
```

No API keys are needed. Every call happens on the server (`src/lib/api/*`), so it's easy to
switch providers later.

## Run it on your computer

1. Install **Node.js 20 LTS** from https://nodejs.org (includes `npm`).
2. Unzip this folder, open a terminal inside it, then run:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:3000.

Locally, the globe guesses your country from your time zone. On Vercel it uses your IP location.

## Put it online (GitHub + Vercel + your GoDaddy domain)

1. **GitHub:** create a new empty repository named `theaccuweather`, then in this folder run:
   ```bash
   git init
   git add .
   git commit -m "Phase 1"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/theaccuweather.git
   git push -u origin main
   ```
2. **Vercel:** sign in with GitHub, then choose **Add New > Project** and import the repo.
   Under **Environment Variables**, add `NEXT_PUBLIC_SITE_URL` = `https://theaccuweather.com`.
   Click **Deploy**. Every later `git push` redeploys automatically.
3. **Domain:** in Vercel go to **Project > Settings > Domains** and add `theaccuweather.com`
   and `www.theaccuweather.com`. Vercel shows the DNS records to create.
4. **GoDaddy:** go to **My Products > theaccuweather.com > DNS**:
   - Edit the `A` record for `@` to the IP Vercel shows.
   - Edit the `CNAME` for `www` to the value Vercel shows.
   - Delete any "Parked" records and turn off forwarding.
   Changes usually apply within minutes (up to 48 hours). Vercel then adds HTTPS by itself.

## Notes

- **Licences:** Open-Meteo is free for non-commercial use with credit (CC BY 4.0), which the
  footer gives. If the site starts making money, it needs a paid Open-Meteo plan and Vercel Pro.
- **India AQI** is estimated from 24-hour averages of model data, so it can differ from
  CPCB station values. The site says this.
- **Name risk:** the site says it is "Not affiliated with AccuWeather, Inc." in the footer and
  About page. Keep it that way and avoid AccuWeather's colours or logo style.
- **Globe image:** `public/earth-2k.jpg` is NASA Blue Marble (public domain).

## What's next

- **Phase 2:** about 30,000 city pages with country and state pages, a full sitemap,
  OpenAQ station readings and a "locations in this city" table.
- **Phase 3:** hourly data collection (database), a worldwide ranking, 30-day history.
- **Phase 4:** a live AQI map and rain radar.
# 1.-theaccuweather
# 1.-theaccuweather
