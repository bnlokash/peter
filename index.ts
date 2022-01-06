import axios from 'axios'
import destination from '@turf/rhumb-destination'
import { point } from '@turf/helpers'
import bearing from '@turf/bearing'
import LatLon from 'geodesy/latlon-spherical'
import { XMLParser, XMLBuilder, XMLValidator} from 'fast-xml-parser'
import fs from 'fs'


const HERE_TOKEN = 'cHE2xvF-Osj95kuUjuNuhhqHWyWhV4II9BATBWXmYw4'


const xml1 = {
    highway: 'Alhambra Avenue',
    between: 'Boustead Avenue and Bloor Street West'
}

const getBetweenParts = between => {
    const parts = between.split(' and ')
    return parts
}


const getIntersectionCoords = async (road1, road2) => {
    const intersectionUrl = `https://geocoder.ls.hereapi.com/6.2/geocode.json?apiKey=${HERE_TOKEN}&city=Toronto&street=${encodeURIComponent(road1)}%20%40%20${encodeURIComponent(road2)}`

    const intersectionResponse = await axios.get(intersectionUrl)
    const {Latitude: lat, Longitude: long} = intersectionResponse.data.Response.View[0].Result[0].Location.NavigationPosition[0]
    console.log(lat, long)
    return { lat, long }
}

// eg between: 'Boustead Avenue and Bloor Street West'
const betweenIntersections = async (xml) => {
    const betweenRoads = getBetweenParts(xml.between)
    const firstIntersection = await getIntersectionCoords(xml.highway, betweenRoads[0])
    const secondIntersection = await getIntersectionCoords(xml.highway, betweenRoads[1])
    return [firstIntersection, secondIntersection]
}
 
//////////

const xml2 = {
    highway: 'Alton Avenue',
    between: 'A point 29 metres north of Sawden Avenue and a point 5.5 metres further north'
}

const getOrdinal = (str) => {
    const ordinals = ['north', 'east', 'west', 'south', 'northwest', 'northeast', 'southwest', 'southeast']
    for (const o of ordinals) {
        if (str.includes(o)) {
            return o
        }
    }

}

const getDistance = str => {
    const parts = str.split(' ')
    const metresIndex = parts.findIndex(e => e === 'metres')
    const distance = parts[metresIndex - 1]
    return distance
}

// eg A point 29 metres north of Sawden Avenue => {distance, ordinal, road}
const getPointParts = (point) => {
    const ofSplit = point.split(' of ')
    const road = ofSplit[1]
    const ordinal = getOrdinal(ofSplit[0])
    const distance = getDistance(ofSplit[0])
    return { road, ordinal, distance}
}

const getFirstPointCoords = async (road, point) => {
    const pointParts = getPointParts(point)
    console.log('point', pointParts)

    const intersectionCoords = await getIntersectionCoords(road, pointParts.road)
    // const bearing = 
    console.log('inter', intersectionCoords)
}


//eg between: A point 29 metres north of Sawden Avenue and a point 5.5 metres further north
const betweenPoints = async (xml) => {
    const betweenParts = getBetweenParts(xml.between)
    const firstPoint = getFirstPointCoords(xml.highway, betweenParts[0])
}

const getBearingWeights = (ordinal, distance) => {
    // if (ordinal = 'north') {
        return { lat: distance * 0.5, long: distance * 0.5 }
    // }
}

const addDistanceToCoords = (distance, ordinal, coords) => {
    const { lat, long } = coords
    const earthRadiusKm = 6378
    // const kmPerDegreeOfLong = (Math.PI /180) * earthRadiusKm * Math.cos((Number(lat) * Math.PI)/180)


    const distanceInKm = distance / 1000
    // const bearingWeights = getBearingWeights(ordinal, distanceInKm)

    const newLat = lat + (0 / earthRadiusKm) * (180/Math.PI)
    const newLong = long + (-distanceInKm / earthRadiusKm) * (180 / Math.PI) / Math.cos(lat * Math.PI/180)

    return { lat: newLat, long: newLong}
}


// doesn't work
const addDistance2 = (distance, coords, bearing) => {
    const { lat, long } = coords
    const earthRadiusKm = 6378
    const R = earthRadiusKm
    const distanceInKm = distance / 1000

const newLat = Math.asin( (Math.sin(lat)*Math.cos(distanceInKm/R)) + (Math.cos(lat)*Math.sin(distanceInKm/R)*Math.cos(bearing)) );

const newLong = long + Math.atan2(Math.sin(bearing)*Math.sin(distanceInKm/R)*Math.cos(lat),Math.cos(distanceInKm/R)-Math.sin(lat)*Math.sin(newLat));

return { lat: newLat, long: newLong }
}

const bearingToDegrees = (bearing) => (({
    north: 343,
    south: 170
})[bearing])

// WORKS
const geoDistance = (distance, coords, bearing) => {
    const p1 = new LatLon(coords.lat, coords.long)
    const p2 = p1.destinationPoint(distance, bearingToDegrees(bearing))
    console.log('geo', p2)
    return p2
}

// betweenIntersections(xml1)
// betweenPoints(xml2)
console.log('start', 43.66821, -79.3298)
// const end = addDistanceToCoords(29, 'north', { lat: 43.66821, long: -79.3298 })
// const end2 = destination(point([43.66821, -79.3298]), 29, -90, { units: 'meters'})
// const end = addDistance2(29, {lat: 43.66821, long: -79.3298}, 0)
// console.log('end', end.lat, end.long)


// const {lat, lon} = geoDistance(250, {lat: 43.66821, long: -79.3298}, 'south')
// console.log(lat, lon)


///// BEGIN PIPELINE
const main = () => {
    const buffer = fs.readFileSync('xml/chapter950/Ch_950_Sch_15_ParkingForRestrictedPeriods_current_to_Feb242021.xml');
    const fileContent = buffer.toString();
    // console.log(fileContent)

    const parser = new XMLParser();
    let jObj = parser.parse(fileContent);

    const builder = new XMLBuilder({});
    const xmlContent = builder.build(jObj);
    for (const [key, value] of Object.entries(xmlContent)) {
        if (key === '11') {
            console.log(value)
        }
    }
}

main()