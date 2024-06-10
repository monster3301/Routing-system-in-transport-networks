let map;
let pathPolyline;
let additionalPathPolyline;
let mainPathCoordinates;
let markers = [];

function initMap() {
    const mapOptions = {
        center: { lat: 48.3794, lng: 31.1656 },
        zoom: 5,
    };
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    
    populateCityDropdowns();
}

function populateCityDropdowns() {

    const startCityDropdown = document.getElementById("startCity")
    const intermediateCityDropdown = document.getElementById("intermediateCity");
    const endCityDropdown = document.getElementById("endCity");

    cities.forEach((city) => {

        const startOption = document.createElement("option");
        startOption.text = city.name;
        startOption.value = JSON.stringify(city);
        startCityDropdown.appendChild(startOption);

        const intermediateOption = document.createElement("option");
        intermediateOption.text = city.name;
        intermediateOption.value = JSON.stringify(city);
        intermediateCityDropdown.appendChild(intermediateOption);

        const endOption = document.createElement("option");
        endOption.text = city.name;
        endOption.value = JSON.stringify(city);
        endCityDropdown.appendChild(endOption);
    
    });
    
    drawCityConnections();
}

function drawCityConnections() {

    cities.forEach((city) => {

        const neighbors = getNeighbors(city);
        const closestNeighbors = findNearestNeighbors(city, neighbors, 3); 
        
        closestNeighbors.forEach((neighbor) => {

        const pathCoordinates = [city, neighbor].map((coord) => ({

            lat: coord.lat,
            lng: coord.lng,
        
        }));
        
        const connection = new google.maps.Polyline({
            path: pathCoordinates,
            strokeColor: "#D3D3D3", 
            strokeOpacity: 1,
            strokeWeight: 1,
            map: map,
        });
        
    });
    
});

}

function validateFuelInputs(truckFuelEfficiency, fuelPricePerLiter) {

    if (!truckFuelEfficiency || truckFuelEfficiency <= 0) {
        alert('Please enter a valid fuel efficiency greater than zero.');
        document.getElementById("truckFuelEfficiency").focus(); 
        console.log('Invalid fuel efficiency:', truckFuelEfficiency);
        return false;
    }

    if (!fuelPricePerLiter || fuelPricePerLiter <= 0) {
        alert('Please enter a valid fuel price per liter greater than zero.');
        document.getElementById("fuelPricePerLiter").focus(); 
        console.log('Invalid fuel price per liter:', fuelPricePerLiter);
        return false;
    }

    if (isNaN(truckFuelEfficiency)) {
        alert('Fuel efficiency must be a number.');
        document.getElementById("truckFuelEfficiency").focus(); 
        console.log('Fuel efficiency is not a number:', truckFuelEfficiency);
        return false;
    }

    if (isNaN(fuelPricePerLiter)) {
        alert('Fuel price per liter must be a number.');
        document.getElementById("fuelPricePerLiter").focus();
        console.log('Fuel price per liter is not a number:', fuelPricePerLiter);
        return false;
    }

    if (truckFuelEfficiency > 100) {
        alert('Please enter a more realistic fuel efficiency.');
        document.getElementById("truckFuelEfficiency").focus(); 
        console.log('Unrealistic fuel efficiency:', truckFuelEfficiency);
        return false;
    }

    if (fuelPricePerLiter > 1000) {
        alert('Fuel price per liter seems unusually high. Please re-enter.');
        document.getElementById("fuelPricePerLiter").focus();
        console.log('Unrealistic fuel price per liter:', fuelPricePerLiter);
        return false;
    }

    return true;
}

// visualization Dijkstra's Algorithm 
async function visualizeAlgorithm() {

    let finalShortestDistance = 0;
    let finalFuel = 0;
    let finalTime = 0;

    const truckFuelEfficiency = parseFloat(document.getElementById("truckFuelEfficiency").value);
    const fuelPricePerLiter = parseFloat(document.getElementById("fuelPricePerLiter").value);

    const isValid = validateFuelInputs(truckFuelEfficiency, fuelPricePerLiter);

    if (!isValid) {
        return;
    }

    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressBar').textContent = '0%';

    startProgressBar();

    document.getElementById("shortestDistance").textContent = "Calculating shortest distance...";
    document.getElementById("fuelCost").textContent = "Calculating fuel cost...";
    document.getElementById("travelTimeDisplay").textContent = "Calculating travel time...";

    const startCityDropdown = document.getElementById("startCity");
    const intermediateCityDropdown = document.getElementById("intermediateCity");
    const endCityDropdown = document.getElementById("endCity");

    const startCity = JSON.parse(startCityDropdown.value);
    const intermediateCity = intermediateCityDropdown.value ? JSON.parse(intermediateCityDropdown.value) : '';
    const endCity = JSON.parse(endCityDropdown.value);

    removeMarkers();
    drawMarker(startCity);

    console.log(`Starting city: ${startCity.name}`);

    if (intermediateCity) {
        drawMarker(intermediateCity);
        console.log(`Intermediate city: ${intermediateCity.name}`);
    }

    drawMarker(endCity);

    console.log(`Ending city: ${endCity.name}`);

    temp = [];
    if (intermediateCity) {

        const { pathCoordinates, shortestDistance } = await calculateDijkstra(startCity, intermediateCity, temp);
        temp.push(pathCoordinates);
        let intermediateCityFuelCost = await getFuelCost(pathCoordinates, shortestDistance, truckFuelEfficiency, fuelPricePerLiter);
        
        console.log(`From ${startCity.name} to ${intermediateCity.name} (intermediate) fuel cost: ${intermediateCityFuelCost}`);
        console.log(`From ${startCity.name} to ${intermediateCity.name} (intermediate) distance: ${shortestDistance}`);

        finalShortestDistance += shortestDistance;
        finalFuel += intermediateCityFuelCost;
        finalTime += getTravelTime(startCity, intermediateCity);

    }

    const { pathCoordinates, shortestDistance } = await calculateDijkstra(intermediateCity, endCity, temp);
    let endCityFuelCost = await getFuelCost(pathCoordinates, shortestDistance, truckFuelEfficiency, fuelPricePerLiter);

    console.log(`From ${intermediateCity.name} to ${endCity.name} (end) fuel cost: ${endCityFuelCost}`);
    console.log(`From ${intermediateCity.name} to ${endCity.name} (end) distance: ${shortestDistance}`);

    finalShortestDistance += shortestDistance;
    finalFuel += endCityFuelCost;
    finalTime += getTravelTime(intermediateCity, endCity);
    
    try {
        if (!isNaN(finalShortestDistance)) {

            if (!isNaN(finalFuel)) {

                resFuelCost = finalFuel;
                document.getElementById("fuelCost").textContent = `Fuel Cost: ${finalFuel.toFixed(2)} UAN`;
            } 
            else {
                document.getElementById("fuelCost").textContent = 'Fuel Cost: Calculation error';
            }
        } 

    } 
    catch (error) { 
        
        console.error('Error during path calculation:', error);
        document.getElementById("shortestDistance").textContent = 'An error occurred during path calculation.';
        document.getElementById("fuelCost").textContent = 'An error occurred during fuel cost calculation.';
    }

    if (finalShortestDistance === Infinity) {
        document.getElementById("shortestDistance").textContent = "No path found or an error occurred.";
    } 
    else {
        document.getElementById("shortestDistance").textContent = `Shortest distance between the selected  cities: ${finalShortestDistance.toFixed(2)} kilometers`;
    }

    if (intermediateCity) {
        displayTravelTime(startCity, intermediateCity, endCity, finalTime);
    } 
    else {
        
        displayTravelTime(startCity, endCity, finalTime);

    }

    completeProgressBar();

}

async function getFuelCost(pathCoordinates, shortestDistance, truckFuelEfficiency, fuelPricePerLiter) {

    let resFuelCost = 0;

    try {
        
        const shortestDistanceKilometers = parseFloat(shortestDistance);

        if (!isNaN(shortestDistanceKilometers)) {
            const fuelCost = calculateFuelCost(shortestDistanceKilometers, truckFuelEfficiency, fuelPricePerLiter);
            if (!isNaN(fuelCost)) {
                resFuelCost = fuelCost;
            }
        }

    } 
    catch (error) {
        console.error('Error during path calculation:', error);
    }

    console.log(`Shortest Path Coordinates:`, pathCoordinates);
    console.log(`Shortest Distance: ${shortestDistance}`);

    return resFuelCost;
}

function startProgressBar() {

    const progressBar = document.getElementById('progressBar');
    let width = 0;
    
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width++;
            progressBar.style.width = width + '%';
            progressBar.textContent = width + '%';
        }
    }, 100); 
    
    progressBar.dataset.interval = interval;
}

function completeProgressBar() {

    const progressBar = document.getElementById('progressBar');
    const interval = parseInt(progressBar.dataset.interval, 10);
    
    clearInterval(interval); 
    
    progressBar.style.width = '100%';
    progressBar.textContent = '100%'; 

}

function calculateFuelCost(distanceKilometers, fuelEfficiency, pricePerLiter) {

    if (isNaN(distanceKilometers) || isNaN(fuelEfficiency) || isNaN(pricePerLiter)) {
        console.error('Invalid input for fuel cost calculation');
        return NaN;
    }

    const fuelNeeded = distanceKilometers / fuelEfficiency; 
    const cost = fuelNeeded * pricePerLiter; 
  
    return cost;
}

// Calculate the shortest path between cities using Dijkstra's algorithm
async function calculateDijkstra(startCity1, endCity1, pathList) { 

    const graph = new Map();
    cities.forEach(city => {
        graph.set(city.name, { 
        name: city.name, 
        lat: city.lat, 
        lng: city.lng, 
        distance: Infinity, 
        parent: null 
        });
    });
    
    graph.get(startCity1.name).distance = 0;
    
    const queue = Array.from(graph.values());
    
    let shortestDistance = Infinity; 

    function getCityWithShortestDistance() {

        let shortestDistance = Infinity;
        let shortestCity = null;

        queue.forEach(city => {
        if (city.distance < shortestDistance) {
            shortestDistance = city.distance;
            shortestCity = city;
        }
        });

        return shortestCity;
    }
  
    async function renderRouteSteps() {
        let count = 0;

        while (queue.length > 0) {
        const currentCity = getCityWithShortestDistance();

        if (currentCity === endCity1) {
            break; 
        }

        queue.splice(queue.indexOf(currentCity), 1);

        const neighbors = findNearestNeighbors(currentCity, queue, 3); 
        neighbors.forEach((neighbor) => {
            const distance = currentCity.distance + getDistance(currentCity, neighbor);
        
            if (distance < neighbor.distance) {
                neighbor.distance = distance;

                graph.get(neighbor.name).previous = currentCity.name; 
                if (neighbor.name === endCity1.name) {
                    shortestDistance = distance;
                }
            }
        });
        
        await sleep(1);

        calculateTemp = [];
        const tempCoordinates = await constructRoute(currentCity, graph, calculateTemp);
        console.log(tempCoordinates);

        await displayPath(tempCoordinates, calculateTemp);


        count++;
        console.log("Step", count);
        }
    }
    await renderRouteSteps();

    const pathCoordinates = constructRoute(endCity1, graph, pathList);

    return {
        pathCoordinates,
        shortestDistance, 
    };

}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function constructRoute(endCity1, graph, list){

    let currentCityName = endCity1.name;
    const pathCoordinates = [];

    while (currentCityName) {

        const currentCity = graph.get(currentCityName);
        pathCoordinates.unshift({ lat: currentCity.lat, lng: currentCity.lng });
        currentCityName = currentCity.previous; 

    }

    console.log(pathCoordinates);
    await displayPath(pathCoordinates, list);

    return pathCoordinates;
}

async function displayPath(pathCoordinates, list) {

    if (pathPolyline) {
        pathPolyline.setMap(null);
    }

    pathPolyline = new google.maps.Polyline({

        path: pathCoordinates,
        strokeColor: "#ff0000",
        strokeOpacity: 1.0,
        strokeWeight: 2

    });
    
    pathPolyline.setMap(map);

    if (list && list.length > 0) {

        if (additionalPathPolyline) {
            additionalPathPolyline.setMap(null);
        }

        console.log('list[0]:', list[0]);
        let additionalPathCoordinates = await Promise.resolve(list[0]);
        console.log('additionalPathCoordinates:', additionalPathCoordinates);

        if (Array.isArray(additionalPathCoordinates)) {

            additionalPathPolyline = new google.maps.Polyline({

                path: additionalPathCoordinates, 
                strokeColor: "#ff0000", 
                strokeOpacity: 0.8,
                strokeWeight: 2

            });

            additionalPathPolyline.setMap(map);

        } 
        else {
            console.error('Invalid coordinates:', additionalPathCoordinates);
        }
    }
}

function findNearestNeighbors(city, neighbors, count) {

    neighbors.sort((a, b) => {
        const beginDistance = getDistance(city, a);
        const endDistance = getDistance(city, b);
        return beginDistance - endDistance;
    });

    return neighbors.slice(0, count);
}

function getNeighbors(city) {
    const neighbors = [];

    cities.forEach(nextCity => {

        if (city && nextCity && city.name !== nextCity.name && isAllowedPath(city, nextCity)) {

          neighbors.push(nextCity);

        }

    });

    return neighbors;

}

function isAllowedPath(city1, city2) {

    return true; 
}

function getDistance(city1, city2) {

    const toRadian = angle => (Math.PI / 180) * angle;
    const earthRadius = 6371;

    const lat1 = toRadian(city1.lat);
    const lng1 = toRadian(city1.lng);
    const lat2 = toRadian(city2.lat);
    const lng2 = toRadian(city2.lng);

    const latDiff = lat2 - lat1;
    const lngDiff = lng2 - lng1;

    const a = Math.sin(latDiff / 2) ** 2 + 
              Math.cos(lat1) * Math.cos(lat2) * 
              Math.sin(lngDiff / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const distance = earthRadius * c;

    return earthRadius * c;
}

// Calculate travel time between cities based on an average speed of 75 km/h
function getTravelTime(city1, city2) {

    const distance = getDistance(city1, city2);
    const speed = 75; 
    const time = distance / speed; 
    return time; 

}

function displayTravelTime(city1, city2, city3 = '', travelTime) {

    console.log(`The travel time between ${city3 ? `${city1.name}, ${city2.name} and ${city3.name}` : `${city1.name} and ${city3.name}`} at an average speed of 75 km/h is approximately ${travelTime.toFixed(2)} hours.`);
    document.getElementById("travelTimeDisplay").textContent = `The travel time between ${city3 ? `${city1.name}, ${city2.name} and ${city3.name}` : `${city1.name} and ${city3.name}`} at an average speed of 75 km/h is approximately ${travelTime.toFixed(2)} hours.`;

}

function removeMarkers() {

    markers.forEach(marker => marker.setMap(null));
    markers = [];

}

function drawMarker(city) {

    const marker = new google.maps.Marker({
        position: { lat: city.lat, lng: city.lng },
        map: map,
        title: city.name,
    });

    markers.push(marker); 
}