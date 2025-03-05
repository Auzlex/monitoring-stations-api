
# Node.js REST API for Monitoring Stations

This project is a Node.js REST API for managing monitoring stations and their pollution records. The API allows users to perform CRUD operations on monitoring stations and their records. This is a work in progress, and some features are still under development and is a Node.js development exercise to improve my understanding and skills.
This REST API will communicate to MongoDB Atlas to a target cluster.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Endpoints](#endpoints)
  - [Stations](#stations)
  - [Records](#records)
  - [Advanced Queries](#advanced-queries)
- [Unit Testing](#unit-testing) <!-- Add this line -->
- [Work in Progress](#work-in-progress)
<!-- - [Contributing](#contributing) -->
<!-- - [License](#license) -->

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Auzlex/monitoring-stations-api
   cd monitoring-stations-api
   ```

2. Install dependencies:
   ```sh
   npm install
    ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   
   **NOTE**: I have implemented an env variable pre-processor to process variable references in the .env
   ```env
    PORT=7000
    MONGODB_PASSWORD=<password>
    MONGODB_URI=mongodb+srv://<username>:${MONGODB_PASSWORD}@<cluster>
   ```

4. Start the server:
   ```sh
   npm start
   ```

## Usage

The API provides endpoints to manage monitoring stations and their pollution records. Below is a list of the available endpoints and their descriptions.

## Endpoints

### Stations

- **GET /stations**
  - Description: Retrieve a list of all monitoring stations with basic information (ID, name, latitude, longitude).
  - Status: Implemented

- **GET /stations/:stationID**
  - Description: Retrieve detailed information about a specific monitoring station.
  - Status: Implemented

- **POST /stations**
  - Description: Add a new monitoring station to the database. This endpoint should be restricted to admin users only.
  - Status: Implemented

- **PATCH /stations/:stationID**
  - Description: Update the name of a specific monitoring station. Only upper and lower case letters and numbers are allowed.
  - Status: Implemented

- **DELETE /stations/:stationID**
  - Description: Delete a specific monitoring station from the database. This endpoint should be restricted to admin users only.
  - Status: Implemented

### Records

- **GET /stations/:stationID/records**
  - Description: Retrieve all pollution records for a specific monitoring station.
  - Status: Implemented

- **POST /stations/:stationID/records**
  - Description: Add a new pollution record to a specific monitoring station. This endpoint should be restricted to admin users only.
  - Status: Implemented

- **GET /stations/records**
  - Description: Retrieve pollution records for all monitoring stations. This endpoint should be publicly accessible.
  - Status: Not Implemented

### Advanced Queries

- **GET /stations/nearest?lat={lat}&lng={lng}&radius={km}**
  - Description: Retrieve a list of monitoring stations within a certain radius of a given location. This endpoint should be publicly accessible.
  - Status: Not Implemented

- **GET /stations/:stationID/summary**
  - Description: Retrieve a summary of pollution records for a specific monitoring station. This endpoint should be publicly accessible.
  - Status: Not Implemented

## Unit Testing

Unit tests have been implemented to ensure the input and output of the endpoints are properly working. The tests are written using Jest and Supertest.

### Tested Endpoints

#### Stations

- **GET /stations**
  - Tests retrieving all stations.
  - Ensures the response status is 200 and the response body contains an array of stations.

- **POST /stations**
  - Tests creating a new station, including validation for missing fields and invalid data.
  - Ensures the response status is 400 for invalid input and 201 for successful creation.
  - Validation scenarios tested:
    - Missing `name` field.
    - Missing `latitude` field.
    - Missing `longitude` field.
    - Non-numeric `latitude`.
    - Non-numeric `longitude`.

- more to be implemented

#### Example output

```sh
GET /stations 200 57.242 ms - 25
GET /stations 200 31.010 ms - 215
GET /stations/67c8232df5f7418c81c31000 200 30.624 ms - 122
GET /stations/67c8232df5f7418c81c31005 404 28.712 ms - 31
POST /stations 400 15.079 ms - 84
POST /stations 400 1.086 ms - 84
POST /stations 400 1.264 ms - 84
POST /stations 400 1.133 ms - 80
POST /stations 400 1.546 ms - 80
POST /stations 201 39.015 ms - 176
 PASS  test/station.test.js
  Stations
    GET /stations
      √ should GET all the stations (660 ms)
      √ should GET a station by the given id (155 ms)
      √ should return 404 for a non-existent station id (64 ms)
    POST /stations
      √ should not POST a station without name field (52 ms)
      √ should not POST a station without latitude field (37 ms)
      √ should not POST a station without longitude field (36 ms)
      √ should not POST a station with non-numeric latitude (35 ms)
      √ should not POST a station with non-numeric longitude (36 ms)
      √ should POST a station (73 ms)
```

### Running the Tests

To run the tests, use the following command:
```sh
npm test
```

## Work in Progress

- Implementing unit testing
- Implementing the `GET /stations/records` endpoint to retrieve pollution records for all monitoring stations.
- Implementing advanced query endpoints for retrieving stations within a certain radius and summarizing pollution records.

<!-- ## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any improvements or new features to add. -->

<!-- ## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details." > README.md -->