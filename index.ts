import axios from 'axios'

const HERE_TOKEN = 'cHE2xvF-Osj95kuUjuNuhhqHWyWhV4II9BATBWXmYw4'


const xml = {
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

betweenIntersections(xml)
