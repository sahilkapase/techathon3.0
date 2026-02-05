import { DateTime } from "luxon";

const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// https://api.openweathermap.org/data/2.5/onecall?lat=48.8534&lon=2.3488&exclude=current,minutely,hourly,alerts&appid=1fa9ff4126d95b8db54f3897a208e91c&units=metric

const getWeatherData = (infoType, searchParams) => {
  const url = new URL(BASE_URL + "/" + infoType);
  console.log(url)
  url.search = new URLSearchParams({ ...searchParams, appid: API_KEY });

  return fetch(url).then((res) => res.json());
};

const formatCurrentWeather = (data) => {
  const {
    coord: { lat, lon },
    main: { temp, feels_like, temp_min, temp_max, humidity },
    name,
    dt,
    sys: { country, sunrise, sunset },
    weather,
    wind: { speed },
  } = data;

  const { main: details, icon } = weather[0];

  return {
    lat,
    lon,
    temp,
    feels_like,
    temp_min,
    temp_max,
    humidity,
    name,
    dt,
    country,
    sunrise,
    sunset,
    details,
    icon,
    speed,
  };
};

const formatForecastWeather = (data) => {
  let { city, list } = data;
  let timezone = city.timezone;

  // Extract hourly (next 5 data points)
  const hourly = list.slice(0, 5).map((d) => {
    return {
      title: formatToLocalTime(d.dt, timezone, "hh:mm a"),
      temp: d.main.temp,
      icon: d.weather[0].icon,
    };
  });

  // Extract daily
  const daily = list.filter((item, index) => index % 8 === 0).slice(0, 5).map((d) => {
    return {
      title: formatToLocalTime(d.dt, timezone, "ccc"),
      temp: d.main.temp,
      icon: d.weather[0].icon,
    };
  });

  return { timezone, daily, hourly };
};

const getFormattedWeatherData = async (searchParams) => {
  // We ONLY call 'forecast' because 'weather' (current) endpoint is failing (401) with this key
  const forecastData = await getWeatherData("forecast", {
    q: searchParams.q || "Pune", // Ensure we pass the query 'q' (city name)
    units: searchParams.units,
  });

  // Derive "current" weather from the first forecast item
  const currentItem = forecastData.list[0];
  const { city } = forecastData;

  const formattedCurrentWeather = {
    lat: city.coord.lat,
    lon: city.coord.lon,
    temp: currentItem.main.temp,
    feels_like: currentItem.main.feels_like,
    temp_min: currentItem.main.temp_min,
    temp_max: currentItem.main.temp_max,
    humidity: currentItem.main.humidity,
    name: city.name,
    dt: currentItem.dt,
    country: city.country,
    sunrise: city.sunrise,
    sunset: city.sunset,
    details: currentItem.weather[0].main,
    icon: currentItem.weather[0].icon,
    speed: currentItem.wind.speed,
  };

  const formattedForecastWeather = formatForecastWeather(forecastData);

  return { ...formattedCurrentWeather, ...formattedForecastWeather };
};

const formatToLocalTime = (
  secs,
  zone,
  format = "cccc, dd LLL yyyy' | Local time: 'hh:mm a"
) => DateTime.fromSeconds(secs).setZone(zone).toFormat(format);

const iconUrlFromCode = (code) =>
  `http://openweathermap.org/img/wn/${code}@2x.png`;

export default getFormattedWeatherData;

export { formatToLocalTime, iconUrlFromCode };
