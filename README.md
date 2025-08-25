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
    ENDPOINT_ADMIN_ACCESS_PASSWORD=admin
    JWT_SECRET=SECRET
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

  - Example Usage:
    ```sh
    # Get all records
    GET /records

    # Get records within a timestamp range
    GET /records?from=2000&to=4000

    # Get records for a specific pollutant
    GET /records?pollutant=o3

    # Get latest 5 records
    GET /records?limit=5

    # Combine multiple filters
    GET /records?from=2000&to=4000&pollutant=no2&limit=3
    ```

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

- **GET /records**
  - Tests retrieving pollution records from all monitoring stations.
  - Ensures the response status is 200 for successful requests and 400 for invalid parameters.
  - Test scenarios:
    - Retrieving all records from all stations
      - Verifies correct count of records
      - Validates all required fields are present
      - Confirms records are sorted by timestamp (newest first)
    - Filtering records by timestamp range
      - Tests filtering with valid from/to timestamps
      - Verifies records are within the specified range
      - Confirms sorting is maintained
    - Filtering records by pollutant type
      - Tests filtering with valid pollutant types
      - Verifies all returned records contain the specified pollutant
    - Limiting the number of records returned
      - Tests limit parameter with valid values
      - Verifies correct number of records are returned
      - Confirms most recent records are returned first
    - Combining multiple filters
      - Tests simultaneous use of timestamp range, pollutant type, and limit
      - Verifies all filters are applied correctly
    - Input validation
      - Tests invalid timestamp format
      - Tests invalid timestamp range (from > to)
      - Tests invalid limit values (negative numbers)
      - Tests invalid pollutant types
    - Handling edge cases
      - Tests behavior with stations containing no records
      - Verifies correct handling of empty result sets
  - Validates that:
    - Records are properly combined from all stations
    - Each record includes the station name
    - All required pollutant fields are present
    - Filters are correctly applied
    - Records are sorted by timestamp (newest first)
    - Error messages are appropriate for each validation case
    - Response format matches the expected structure
    - Count field accurately reflects the number of records

#### Example output

```sh
 PASS  test/station.test.js
  Stations
    GET /stations
      √ should GET all the stations (552 ms)
      √ should GET a station by the given id (134 ms)
      √ should not POST a station without name field (43 ms)
      √ should not POST a station without latitude field (33 ms)
      √ should not POST a station without longitude field (34 ms)
      √ should POST a station (65 ms)
    PATCH /stations/:stationID
      √ should not PATCH a station with invalid name format (94 ms)
      √ should return 404 when PATCHing a non-existent station (96 ms)
    DELETE /stations/:stationID
      √ should DELETE only the target station (184 ms)
      √ should return 404 when deleting a non-existent station (181 ms)
    GET /records
      √ should GET all records from all stations (155 ms)
      √ should filter records by timestamp range (152 ms)
      √ should filter records by pollutant type (152 ms)
      √ should limit the number of records returned (161 ms)
      √ should combine multiple filters (154 ms)
      √ should return 400 for invalid timestamp format (118 ms)
      √ should return 400 for invalid timestamp range (120 ms)
      √ should return 400 for invalid limit (123 ms)
      √ should return 400 for invalid pollutant type (119 ms)
      √ should handle empty records (193 ms)

Test Suites: 1 passed, 1 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        4.367 s, estimated 5 s
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