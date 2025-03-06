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

- **GET /records**
  - Description: Retrieve pollution records for all monitoring stations. This endpoint should be publicly accessible.
  - Status: Implemented
  - Query Parameters:
    - `from`: Filter records from this timestamp (optional)
    - `to`: Filter records until this timestamp (optional)
    - `limit`: Limit the number of records returned (optional)
    - `pollutant`: Filter records by pollutant type (optional)
  - Response Format:
    ```json
    {
      "count": number,
      "records": [
        {
          "stationName": string,
          "ts": number,
          "nox": number,
          "no2": number,
          "no": number,
          "pm10": number,
          "co": number,
          "o3": number,
          "so2": number
        }
      ]
    }
    ```
  - Features:
    - Returns records from all stations combined
    - Records are sorted by timestamp (newest first)
    - Each record includes the station name
    - Supports filtering by timestamp range
    - Supports filtering by pollutant type
    - Supports limiting the number of records
    - Validates all input parameters
    - Returns appropriate error messages for invalid inputs

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

- **PATCH /stations/:stationID**
  - Tests updating a station's name, including validation and error handling.
  - Ensures the response status is 200 for successful updates and appropriate error codes for failures.
  - Test scenarios:
    - Successfully updating a station's name.
    - Attempting to update with invalid name format (special characters).
    - Attempting to update a non-existent station.
  - Validates that:
    - The station ID remains unchanged after update.
    - The database state is correctly updated.
    - Error messages are appropriate for each failure case.

- **DELETE /stations/:stationID**
  - Tests deleting a station, including validation and error handling.
  - Ensures the response status is 200 for successful deletion and 404 for non-existent stations.
  - Test scenarios:
    - Successfully deleting a specific station while preserving other stations in the database.
    - Attempting to delete a non-existent station.
  - Validates that:
    - Only the target station is removed from the database.
    - Other stations remain untouched and maintain their original data.
    - The response message is appropriate.
    - Non-existent stations return appropriate error messages.
    - Database integrity is maintained during deletion operations.

#### Records

- **GET /stations/records**
  - Tests retrieving pollution records from all monitoring stations.
  - Ensures the response status is 200 for successful requests and 400 for invalid parameters.
  - Test scenarios:
    - Retrieving all records from all stations.
    - Filtering records by timestamp range.
    - Filtering records by pollutant type.
    - Limiting the number of records returned.
    - Handling invalid timestamp formats.
    - Handling invalid timestamp ranges.
    - Handling invalid limit values.
    - Handling invalid pollutant types.
  - Validates that:
    - Records are properly combined from all stations.
    - Each record includes the station name.
    - Filters are correctly applied.
    - Records are sorted by timestamp (newest first).
    - Error messages are appropriate for each validation case.
    - Response format matches the expected structure.

#### Example output

```sh
GET /stations 200 46.541 ms - 25
GET /stations 200 28.722 ms - 215
GET /stations/67c9899e19bc37c9530d7070 200 26.927 ms - 122
GET /stations/67c9899e19bc37c9530d7075 404 25.379 ms - 31
POST /stations 400 11.872 ms - 84
POST /stations 400 1.075 ms - 84
POST /stations 400 1.023 ms - 84
POST /stations 400 1.031 ms - 80
POST /stations 400 1.138 ms - 80
POST /stations 201 34.743 ms - 176
PATCH /stations/67c9899f19bc37c9530d7080 200 35.805 ms - 241
PATCH /stations/67c9899f19bc37c9530d708b 404 25.870 ms - 31
  Stations
    GET /stations
      √ should GET all the stations (608 ms)
      √ should GET a station by the given id (138 ms)
      √ should return 404 for a non-existent station id (65 ms)
    POST /stations
      √ should not POST a station without name field (44 ms)
      √ should not POST a station without latitude field (31 ms)
      √ should not POST a station without longitude field (34 ms)
      √ should not POST a station with non-numeric latitude (31 ms)
      √ should not POST a station with non-numeric longitude (36 ms)
      √ should POST a station (73 ms)
    PATCH /stations/:stationID
      √ should PATCH a station name successfully (130 ms)
      √ should not PATCH a station with invalid name format (95 ms)
      √ should return 404 when PATCHing a non-existent station (89 ms)
    DELETE /stations/:stationID
      √ should DELETE a station successfully (130 ms)
      √ should return 404 when deleting a non-existent station (65 ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        2.655 s, estimated 17 s
Ran all test suites.
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