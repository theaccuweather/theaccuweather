// One place for site-wide settings. Change the domain here or via NEXT_PUBLIC_SITE_URL.
export const SITE = {
  name: 'theaccuweather',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theaccuweather.com',
  description:
    'Live air quality index (AQI), PM2.5, PM10 and weather forecasts for cities worldwide.',
  disclaimer: 'Not affiliated with AccuWeather, Inc.',
};

// How long (seconds) server-fetched weather and AQI data is reused before refreshing.
// 15 minutes keeps us far below Open-Meteo's free limits even with lots of visitors.
export const REVALIDATE_SECONDS = 900;
