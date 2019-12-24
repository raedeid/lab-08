'use strict'

const express = require('express');

const cors = require('cors');

const server = express();

const superagent = require('superagent');
const pg = require('pg')

const client = new pg.Client(process.env.DATABASE_URL)
client.connect()
.then(()=>{
    server.listen(PORT,()=>{
        console.log('database connected');
    })
});

server.use(cors());

require('dotenv').config();

const PORT = process.env.PORT || 3300;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const DARKSKY_API_KEY = process.env.DARKSKY_API_KEY;
const EVENTFUL_APP_KEY  = process.env.EVENTFUL_APP_KEY;

server.listen(PORT,()=>{
    console.log(' at PORT 3300');
})

server.get('/',(request,response)=>{
    response.status(200).send('worked');
})

server.get('/location', locationHandler);

function Location(city, locationData) {
    this.formatted_query = locationData[0].display_name;
    this.latitude = locationData[0].lat;
    this.longitude = locationData[0].lon;
    this.search_query = city;
}

function locationHandler(request, response) {
    // Read the city from the user (request) and respond
    let city = request.query['city'];
    getLocationData(city)
        .then((data) => {
            response.status(200).send(data);
        });
}
function getLocationData(city) {
    const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json&limit=1`;

    // Superagent
    return superagent.get(url)
        .then((data) => {
            let location = new Location(city, data.body);
            return location;
        });
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
/////////////////////////////////////////////////////////////////////
// server.get('/eventful', eventFulHandler);
// function Event(data){
//     this.link =data.url;
//     this.name =data.title;
//     this.event_date=data.start_time;
//     this.summary=data.description;
// }
// function eventFulHandler(request, response) {
//     let city = request.query.formatted_query;
//     // let lat = request.query.formatted_query;
//     // let lon = request.query.formatted_query;
//     console.log(city);
//     getEventData(city)
//         .then((output) => {
//             response.status(200).send(output);
//         });
// }
// function getEventData(formatted_query) {
//     const url = `http://api.eventful.com/json/events/search?app_key=${EVENTFUL_APP_KEY}&location=${formatted_query}&format=json&limit=1`;
//     console.log(url)
//     return superagent.get(url)
//         .then((data) => {
//             let convertData = JSON.parse(data.text);
//             console.log(convertData);
//             let first = convertData.events.event
//             let element= first.map(day => new Event(day));
//             // console.log(element)
//             return element;
        
//         })
// }




server.use('*', (request, response) => {
    response.status(404).send('Sorry, not found');
});

server.use((error, request, response) => {
    response.status(500).send(error);
});




