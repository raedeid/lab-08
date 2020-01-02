'use strict'

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);

const server = express();
server.use(cors()); 

const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const DARKSKY_API_KEY = process.env.DARKSKY_API_KEY;
const EVENTFUL_API_KEY  = process.env.EVENTFUL_APP_KEY;

server.listen(PORT,()=>{
    console.log(' at PORT 3000');
})

server.get('/',(request,response)=>{
    response.status(200).send('worked');
})

server.get('/location', locationHandler);

function Location(city, data) {
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
  this.search_query = city;
}


function locationHandler(request, response) {

    let city = request.query['city'];

    getLocationData(city)
    .then((data) => {
        response.status(200).send(data);
    });
}


function getLocationData(city) {
    
    let sql = `SELECT * FROM information WHERE city = $1`;
    let values = [city];
    return client.query(sql, values)
    .then(results => {
      if (results.rowCount) {
          return results.rows[0];
      } else {
          const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json&limit=1`;

          return superagent.get(url)
          
          .then(data => dataBaseLocation(city, data.body));
        }
    });
}


// //////
function dataBaseLocation(city, data) {
    // console.log('database location works');
    // console.log(data);
    
    const location = new Location(city ,data[0]);
    let SQL = `
    INSERT INTO information (city, latitude, longitude) 
    VALUES ($1, $2, $3) 
    RETURNING *
    `;

    let values = [city, location.latitude, location.longitude];
    return client.query(SQL, values)
    .then(results => results.rows[0]);
}





server.get('/weather', weatherHandler);

function Weather(day) {
    this.time = new Date(day.time * 1000).toDateString();
    this.forecast = day.summary;
}

function weatherHandler(request, response) {
    let lat = request.query['latitude'];
    console.log(lat)
    let lng = request.query['longitude'];
    getWeatherData(lat, lng)
    .then((data) => {
        response.status(200).send(data);
    });
    
}

function getWeatherData(lat, lng) {
    const url = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${lat},${lng}`;
    return superagent.get(url)
    .then((weatherData) => {
        // console.log(weatherData.body.daily.data);
        let weather = weatherData.body.daily.data.map((day) => new Weather(day));
        return weather;
    });
}
server.get('/events', eventHandler);

function Event(day) {
    this.link = day.url;
    this.name = day.title;
    this.eventDate = day.start_time;
    this.summary = day.description;
}

function eventHandler(request, response) {
    let lat = request.query['latitude'];
    let lng = request.query['longitude'];
    getEventData(lat, lng)
    .then((data) => {
        response.status(200).send(data);
    });
    
}

function getEventData(lat, lng) {
    const url = `http://api.eventful.com/json/events/search?app_key=${EVENTFUL_API_KEY}&where=${lat},${lng}`;
    // console.log(url);
    return superagent.get(url)
    .then((eventData) => {
        let dataBase = JSON.parse(eventData.text);
        //   console.log(dataBase.events.event[0].description);
        let events = dataBase.events.event.map((day) => new Event(day));
        return events;
    });
}



server.use('*', (request, response) => {
    response.status(404).send('Sorry, not found');
});

server.use((error, request, response) => {
    response.status(500).send(error);
});

client.connect()
.then(()=>{
    server.listen(PORT,()=>{
        console.log('database connected');
    })
});



