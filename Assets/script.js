
$(document).ready( () => {
  
  const searchCityInputEl = $('#search-city-input');
  const searchBtn = $('#search-city-btn');
  const searchResultDiv = $('.search-result');

  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const queryOptions = ['weather?', 'uvi?', 'forecast?'];
  const owmAPIKey = 'e8c30706e437d040e133f03a2281bcb1';
  const unitsFormatOptions = {
    kelvin: '',
    fahrenheit: '&units=imperial',
    celsius: '&units=metric'
  };
  let unitFormat = unitsFormatOptions.celsius;

  const weatherData = [];
  const forecastData = [];
  let savedLocations = [];

  // *****APPLICATION FUNCTIONS*****
  // GET SAVED LOCATIONS FROM LOCAL STORAGE
  function getLocations() {
    // Prevent writing null to array when no localStorage has been set
    if (localStorage.getItem("Cities Searched") === null) {
      return;
    } else { //Write localStorage to savedLocations array
      savedLocations = JSON.parse(localStorage.getItem("Cities Searched"));
      renderLocations();
    };
  };

  // RENDER SAVED LOCATIONS
  function renderLocations() {
    const ulEl = $('.search-list');
    ulEl.empty();
    savedLocations.forEach(location => {
      let liEl = $('<li class="list-group-item saved-search-item">');
      liEl.text(location);
      ulEl.append(liEl);
    });
  }
  
  // SAVE SEARCHED LOCATION
  function saveLocation(location) {
    // Set the location to be checked to lower case**
    let checkLocation = location.toLowerCase();
    // IF saved locations array length == 0, 
    if (savedLocations.length == 0) {
      // THEN push new location to array, 
      savedLocations.push(location);
      // AND save to local storage
      localStorage.setItem(
        "Cities Searched", 
        JSON.stringify(savedLocations)
      );
      // Call renderLocations function
      renderLocations();
    } 
    // ELSE
    else {
      for (let i = 0; i < savedLocations.length; i++) {
        let checkItem = savedLocations[i].toLowerCase();
        console.log(checkItem);
        if (checkLocation == checkItem) {
          console.log('test');
          return
        } else {
          // push new location to array, 
          savedLocations.push(location);
          // AND save to local storage
          localStorage.setItem(
            "Cities Searched", 
            JSON.stringify(savedLocations)
          );
          // Call renderLocations function
          renderLocations();
          return
        };
      };
    };
  }

  // HANDLE ALL API CALLS
  function apiCall(queryURL) {
    return new Promise ((resolve, reject) => {
      $.ajax({
        url: queryURL,
        method: 'GET',
        success: function(response) {
          resolve(response);
        },
        error: function(error) {
          reject(error);
        }
      });
    })
  }

  // CONVERT UNIX DATE RECEIVED FROM OWM
  function convertUnixDate(unixDate) {
    let date = new Date(unixDate * 1000);
    return date;
  }

  // BUILD QUERY URL FOR CURRENT WEATHER API CALL
  function buildWeatherQueryURL(query) {
    let weatherQueryURL = '';
    // Components of the weather query url
    // This approach allows for a future "user settings" feature where the user can set
    // their preferences for unitFormat, for e.g.
    const weatherQueryURLArray = [
      {component: 'corsAnywhereURL', value: 'https://cors-anywhere.herokuapp.com/'},
      {component: 'owmBaseQueryURL', value: 'api.openweathermap.org/data/2.5/'},
      {component: 'queryType', value: queryOptions[0]},
      {component: 'queryKey', value: 'q=' + query.replace(/ /g, '+')},
      {component: 'appIdKey', value: '&appid=' + owmAPIKey},
      {component: 'unitsFormat', value: unitFormat}
    ];
    // Add the value of each weather query url array component to the weather query url
    weatherQueryURLArray.forEach(component => weatherQueryURL += component.value);
    return weatherQueryURL;
  }

  // BUILD QUERY URL FOR UVI API CALL
  function buildUVIQueryURL(lat, lon) {
    let uviQueryURL = '';
    // Components of the UVI query url
    const uviQueryURLArray = [
      {component: 'corsAnywhereURL', value: 'https://cors-anywhere.herokuapp.com/'},
      {component: 'owmBaseQueryURL', value: 'api.openweathermap.org/data/2.5/'},
      {component: 'queryType', value: queryOptions[1]},
      {component: 'appIdKey', value: '&appid=' + owmAPIKey},
      {component: 'latKey', value: '&lat=' + lat},
      {component: 'lonKey', value: '&lon=' + lon}
    ];
    // Add the value of each UVI query url array component to the UVI query url
    uviQueryURLArray.forEach(component => uviQueryURL += component.value);
    return uviQueryURL;
  }

  // BUILD QUERY URL FOR FORECAST API CALL
  function buildForecastQueryURL(lat, lon) {
    let forecastQueryURL = '';
    // Components of the forecast query url
    const forecastQueryURLArray = [
      {component: 'corsAnywhereURL', value: 'https://cors-anywhere.herokuapp.com/'},
      {component: 'owmBaseQueryURL', value: 'api.openweathermap.org/data/2.5/'},
      {component: 'queryType', value: queryOptions[2]},
      {component: 'latKey', value: '&lat=' + lat},
      {component: 'lonKey', value: '&lon=' + lon},
      {component: 'appIdKey', value: '&appid=' + owmAPIKey},
      {component: 'unitsFormat', value: unitFormat}
    ];
    // Add the value of each forecast query url array component to the forecast query url
    forecastQueryURLArray.forEach(component => forecastQueryURL += component.value);
    return forecastQueryURL;
  }

  // SET UVI CATEGORY USING UVI VALUE RETURNED FROM UVI API CALL
  function setUVICategory(value) {
    let category = '';
    if (value < 3) {
      category = 'Low';
    } else if (value < 6) {
      category = 'Moderate';
    } else if (value < 8) {
      category = 'High';
    } else if (value < 11) {
      category = 'Very high';
    } else {
      category = 'Extreme';
    };
    return category;
  }

  // SET MIN AND MAX TEMPS FOR CURRENT WEATHER
  function setCurrentWeatherMinMaxTemp(currentWeather) {
    const forecastResponse = weatherData[3].list;
    let weatherMinTemp = 100;
    let weatherMaxTemp = -100;

    for (let i = 0; i < forecastResponse.length; i++) {
      let currentDay = currentWeather.currentDay;
      let forecastDate = convertUnixDate(forecastResponse[i].dt);
      let forecastDay = forecastDate.getDate();
      let tempMin = forecastResponse[i].main.temp_min;
      let tempMax = forecastResponse[i].main.temp_max;

      // IF forecast day is equal to current day and month
      if (forecastDay == currentDay) {
        // IF forecast min temp is less than weather min temp check value
        if (tempMin < weatherMinTemp) {
          // THEN update weather min temp check value with forecast min temp
          weatherMinTemp = tempMin;
          // AND assign to currentWeather object
          currentWeather.mainMinTemp = Math.round(weatherMinTemp);
        };
        // IF forecast max temp is greater than weather max temp check value
        if (tempMax > weatherMaxTemp) {
          // THEN update weather max temp check value with forecast max temp
          weatherMaxTemp = tempMax;
          // AND assign to currentWeather object
          currentWeather.mainMaxTemp = Math.round(weatherMaxTemp);
        };
      } 
      //ELSE return
      else {
        return;
      };
    };
  }

  // SET FORECAST MIN TEMP
  function setForecastMinTemp(index) {
    // Assign forecast response pushed to weather data array
    const forecastResponse = weatherData[3].list;
    // Start with a high value (celsius) to check returned min temps against
    let forecastMinTemp = 100;
    // Iterate through forecast response
    for (let i = 0; i < forecastResponse.length; i++) {
      // Assign check date based on index passed in
      let checkDate = convertUnixDate(forecastResponse[index].dt);
      // Convert check date to a number representing the day
      let checkDay = checkDate.getDate();
      let forecastDate = convertUnixDate(forecastResponse[i].dt);
      let forecastDay = forecastDate.getDate();
      let tempMin = forecastResponse[i].main.temp_min;
      // IF forecast day is equal to check day
      if (forecastDay == checkDay) {
        // THEN IF forecast min temp is less than the check value
        if (tempMin < forecastMinTemp) {
          // THEN set forecast min temp as the new check value
          forecastMinTemp = tempMin;
        };
      }
    };
    // Return final forecast min temp as an integer
    return Math.round(forecastMinTemp);
  }

  // SET FORECAST MAX TEMP
  function setForecastMaxTemp(index) {
    // Assign forecast response pushed to weather data array
    const forecastResponse = weatherData[3].list;
    // Start with a low value (celsius) to check returned max temps against
    let forecastMaxTemp = -100;
    // Iterate through forecast response
    for (let i = 0; i < forecastResponse.length; i++) {
      // Assign check date based on index passed in
      let checkDate = convertUnixDate(forecastResponse[index].dt);
      // Convert check date to a number representing the day
      let checkDay = checkDate.getDate();
      let forecastDate = convertUnixDate(forecastResponse[i].dt);
      let forecastDay = forecastDate.getDate();
      let tempMax = forecastResponse[i].main.temp_max;
      // IF forecast day is equal to check day
      if (forecastDay == checkDay) {
        // THEN IF forecast max temp is greater than the check value
        if (tempMax > forecastMaxTemp) {
          // THEN set forecast max temp as the new check value
          forecastMaxTemp = tempMax;
        };
      };
    };
    // Return final forecast max temp as an integer
    return Math.round(forecastMaxTemp);
  }

  // SET FORECAST DATA
  function setForecastData() {
    // Assign forecast response pushed to weather data array
    const forecastResponse = weatherData[3];
    // Set min temps for each forecast day
    const forecastMinTemps = [
      {day: 1, value: setForecastMinTemp(7)},
      {day: 2, value: setForecastMinTemp(15)},
      {day: 3, value: setForecastMinTemp(23)},
      {day: 4, value: setForecastMinTemp(31)}
    ];
    // Set max temps for each forecast day
    const forecastMaxTemps = [
      {day: 1, value: setForecastMaxTemp(7)},
      {day: 2, value: setForecastMaxTemp(15)},
      {day: 3, value: setForecastMaxTemp(23)},
      {day: 4, value: setForecastMaxTemp(31)}
    ];
    // Set forecast data for each day
    for (let i = 7; i < 32; i += 8) {
      let j = 11;
      // Utilising forecast data constructor
      let forecastDay = new ForecastData(
        forecastResponse.list[i].dt,
        forecastResponse.list[j].weather[0].id,
        forecastResponse.list[j].main.humidity
      );
      // Push each forecast day into forecast data array
      forecastData.push(forecastDay);
      j += 8;
    };
    // Add forecast min and max temps to each forecast day
    for (let i = 0; i < forecastMinTemps.length; i++) {
      forecastData[i].minTemp = forecastMinTemps[i].value;
      forecastData[i].maxTemp = forecastMaxTemps[i].value;
    }
  }

  // RENDER CURRENT WEATHER SECTION
  function renderCurrentWeather() {
    const currentWeather = weatherData[2];
    const currentWeatherHTML = `
      <h2 class="section-title animated slideInRight">Current weather</h2>
      <div class="current-weather-container animated slideInRight">
        <section class="current-weather">
          <div class="cw-city-date">
            <h5 class="cw-city">${currentWeather.cityName}</h5>
            <h5 class="cw-date">${currentWeather.currentDay} ${currentWeather.currentMonth}</h5>
          </div>
          <div class="cw-details">
            <div class="cw-temp">
              <div class="cw-main-temp">${currentWeather.mainTemp}&#8451</div>
              <div class="cw-min-max-temp">${currentWeather.mainMinTemp}&#8451 / ${currentWeather.mainMaxTemp}&#8451</div>
            </div>
            <div class="cw-icon">
              <i class="wi wi-owm-${currentWeather.weatherId}"></i>
            </div>
            <div class="cw-uvi">
              <legend class="cw-uvi-title">UV Index</legend>
              <div class="cw-uvi-value uvi-${currentWeather.uviCategory.toLowerCase()}">${currentWeather.uviValue}</div>
              <div class="cw-uvi-cat ${currentWeather.uviCategory.toLowerCase()}">${currentWeather.uviCategory}</div>
            </div>
          </div>
          <div class="cw-wind-humidity">
            <div class="cw-wind">
              <legend class="cw-wind-title">Wind speed</legend>
              <div class="cw-wind-value">${currentWeather.windSpeed} km/hr</div>
            </div>
            <div class="cw-main">
              <legend class="cw-main-description">${currentWeather.weatherMain}</legend>
            </div>
            <div class="cw-humidity">
              <legend class="cw-humidity-title">Humidity</legend>
              <div class="cw-humidity-value">${currentWeather.mainHumidity}%</div>
            </div>
          </div>
        </section>
      </div>
    `;
    searchResultDiv.append(currentWeatherHTML);
  }

  // RENDER FORECAST SECTION
  function renderForecast() {
    const h2El = $('<h2 class="section-title animated slideInRight">Forecast</h2>');
    searchResultDiv.append(h2El);
    const sectionEl = $('<section class="weather-forecast animated slideInRight">');
    
    forecastData.forEach(day => {
      let wfDayDiv = $('<div class="wf-day">');
      let wfDateDiv = $('<div class="wf-date">');
      let wfDetailsDiv = $('<div class="wf-details">');
      let wfTempDiv = $('<div class="wf-temp">');
      let wfDayH5El = $('<h5 class="wf-date">');
      let wfTempLegendEl = $('<legend class="wf-min-max-temp-title">Min / Max</legend>');
      let wfMinMaxTempDiv = $('<div class="wf-min-max-temp">');
      let wfIconDiv = $('<div class="wf-icon">');
      let iconEl = $('<i>');
      let wfHumidityDiv = $('<div class="wf-humidity">');
      let wfHumidityLegend = $('<legend class="wf-humidity-title">Humidity</legend>');
      let wfHumidityValueDiv = $('<div class="wf-humidity-value">');

      wfDayH5El.text(day.weekday + ', ' + day.day + ' ' + day.month);
      wfDateDiv.append(wfDayH5El);
      wfDayDiv.append(wfDateDiv);

      wfMinMaxTempDiv.html(day.minTemp + '&#8451 / ' + day.maxTemp + '&#8451');
      wfTempDiv.append(wfTempLegendEl);
      wfTempDiv.append(wfMinMaxTempDiv);
      wfDetailsDiv.append(wfTempDiv);


      iconEl.addClass('wi wi-owm-' + day.weatherId);
      wfIconDiv.append(iconEl);
      wfDetailsDiv.append(wfIconDiv);

      wfHumidityValueDiv.text(day.humidity + '%');
      wfHumidityDiv.append(wfHumidityLegend);
      wfHumidityDiv.append(wfHumidityValueDiv);
      wfDetailsDiv.append(wfHumidityDiv);

      wfDayDiv.append(wfDetailsDiv);
      sectionEl.append(wfDayDiv);
    });
    searchResultDiv.append(sectionEl);
  }

  // CURRENT WEATHER DATA CONSTRUCTOR
  function CurrentWeatherData(data) {
    this.cityName = data.name;
    this.latValue = data.coord.lat;
    this.lonValue = data.coord.lon;
    this.unixDate = data.dt * 1000;
    this.date = convertUnixDate(data.dt);
    this.currentDay = this.date.getDate();
    this.currentMonthIndex = this.date.getMonth();
    this.currentMonth = month[this.currentMonthIndex].slice(0,3);
    this.weatherId = data.weather[0].id;
    this.weatherMain = data.weather[0].main;
    this.mainTemp = Math.round(data.main.temp);
    this.mainHumidity = data.main.humidity;
    this.windSpeed = data.wind.speed;
  }

  // FORECAST DATA CONSTRUCTOR
  function ForecastData(date, weatherId, humidity) {
    this.date = convertUnixDate(date);
    this.day = this.date.getDate();
    this.weekdayIndex = this.date.getDay();
    this.weekday = weekday[this.weekdayIndex];
    this.monthIndex = this.date.getMonth();
    this.month = month[this.monthIndex];
    this.weatherId = weatherId;
    this.humidity = humidity;
  }
  
  // ASYNC FUNCTION TO PROCESS REQUESTS FOR WEATHER DATA
  async function processWeatherData(searchValue) {
    try {
      // Get current weather data
      const weatherQueryURL = buildWeatherQueryURL(searchValue);
      const weatherResponse = await apiCall(weatherQueryURL);
      const currentWeather = new CurrentWeatherData(weatherResponse);
      weatherData.push(weatherResponse);
      // Get UVI for current weather data
      const uviQueryURL = buildUVIQueryURL(currentWeather.latValue, currentWeather.lonValue);
      const uviResponse = await apiCall(uviQueryURL);
      const { value } = uviResponse;
      const uviCategory = setUVICategory(value);
      currentWeather.uviValue = Math.round(value);
      currentWeather.uviCategory = uviCategory;
      weatherData.push(uviResponse);
      weatherData.push(currentWeather);
      // Get forecast weather data
      const forecastQueryURL = buildForecastQueryURL(currentWeather.latValue, currentWeather.lonValue);
      const forecastResponse = await apiCall(forecastQueryURL);
      weatherData.push(forecastResponse);
      setForecastData();
      setCurrentWeatherMinMaxTemp(currentWeather);
      // Render HTML
      renderCurrentWeather();
      renderForecast();
      // Empty weather and forecast data arrays ready for subsequent calls
      weatherData.length = 0;
      forecastData.length = 0;
    } catch (error) {
      console.log(error);
    }
  }

  // Call getLocations function
  getLocations();

  // Event listener for search button
  $(searchBtn).on('click', (event) => {
    event.preventDefault();
    let searchCityVal = searchCityInputEl.val().trim();
    if (searchCityVal === '') {
      return;
    } else {
      searchCityInputEl.val('');
      searchResultDiv.empty();
      saveLocation(searchCityVal);
      processWeatherData(searchCityVal);
    }
  });

  // Event listener for saved searches list
  $('.search-list').on('click', (event) => {
    event.preventDefault();
    console.log('Click!');
    const searchCityVal = $(event.target).text();
    searchResultDiv.empty();
    processWeatherData(searchCityVal);
  });

});
