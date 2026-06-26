# Node.js REST API for Monitoring Stations

This project is a Node.js REST API for managing monitoring stations and their pollution records. The API allows users to perform CRUD operations on monitoring stations and their records. This is a work in progress, and some features are still under development and is a Node.js development exercise to improve my understanding and skills.
This REST API communicates with a PostgreSQL database via Prisma ORM.

## Note

There is a main and dev branch.
All code is committed to the dev branch and automated tests with github workflows will verify test cases, upon successful pass of the jest tests only then the code can be merged with main.

## Table of Contents

- [Prerequisites](#prerequisites)
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

## Prerequisites

Ensure you have the following installed on your host system:
* **Node.js**: Version `20.0.0` or higher
* **pnpm**: Version `11.0.0` or higher
* **Docker Desktop** (or Docker Engine with Compose): Needed to spin up PostgreSQL service containers for testing and local development.

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Auzlex/monitoring-stations-api
   cd monitoring-stations-api
   ```

2. Install dependencies:
   ```sh
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory using `.env.example` as a template:
   ```env
   PORT=7000
   ENDPOINT_ADMIN_ACCESS_PASSWORD=admin
   JWT_SECRET=your_jwt_secret_here
   
   DB_USER=auzlex
   DB_PASSWORD=your_db_password_here
   DB_NAME=monitoring_db
   DB_PORT=5435
   
   DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public
   ```

4. Run locally:
   * Simply start the integrated development orchestrator:
     ```sh
     pnpm run dev
     ```
     This custom script will:
     1. Spin up the PostgreSQL Docker container in the background.
     2. Ensure database schemas are synchronized with Prisma.
     3. Start the Express development server with live-reloading (`nodemon`).
     4. **Auto-clean**: Automatically stop and remove the PostgreSQL container when you exit/stop the command (`Ctrl+C`).

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

### User

  - **POST /user/login**
  - Description: Log in with email and password. Returns a JWT token if the credentials are valid.
  - Request Body:
    ```json
    {
      "email": "user@example.com",
      "password": "admin"
    }
    ```
  - Responses:
    - **200 OK**: 
      ```json
      {
        "token": "<JWT_TOKEN>"
      }
      ```
    - **401 Unauthorized**: 
      ```json
      {
        "message": "Invalid credentials"
      }
      ```
    - **500 Internal Server Error**: 
      ```json
      {
        "error": "Error message"
      }
      ```
  - Notes: 
    - Admin role is assigned if the email is `admin@example.com`. Simple password auth to grab a token for restricted endpoints if password is known.
    - JWT token expires in 1 hour.

### Advanced Queries

- **GET /stations/nearest?lat={lat}&lng={lng}&radius={km}**
  - Description: Retrieve a list of monitoring stations within a certain radius of a given location (calculates Haversine distance). This endpoint is publicly accessible.
  - Status: Implemented

- **GET /stations/:stationID/summary**
  - Description: Retrieve a summary (average, minimum, maximum, and count metrics per pollutant) of pollution records for a specific monitoring station. This endpoint is publicly accessible.
  - Status: Implemented

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
PASS test/station.test.ts (6.333 s)
  Stations
    GET /stations
      √ should GET all the stations (2113 ms)
      √ should GET a station by the given id (32 ms)
      √ should return 404 for a non-existent station id (15 ms)
    POST /stations
      √ should not POST a station without name field (32 ms)
      √ should not POST a station without latitude field (12 ms)
      √ should not POST a station without longitude field (12 ms)
      √ should not POST a station with non-numeric latitude (19 ms)
      √ should not POST a station with non-numeric longitude (22 ms)
      √ should POST a station (25 ms)
    PATCH /stations/:stationID
      √ should PATCH a station name successfully (27 ms)
      √ should not PATCH a station with invalid name format (26 ms)
      √ should return 404 when PATCHing a non-existent station (23 ms)
    DELETE /stations/:stationID
      √ should DELETE only the target station (35 ms)
      √ should return 404 when deleting a non-existent station (26 ms)
    GET /records
      √ should GET all records from all stations (34 ms)
      √ should filter records by timestamp range (31 ms)
      √ should filter records by pollutant type (32 ms)
      √ should limit the number of records returned (32 ms)
      √ should combine multiple filters (30 ms)
      √ should return 400 for invalid timestamp format (32 ms)
      √ should return 400 for invalid timestamp range (28 ms)
      √ should return 400 for invalid limit (27 ms)
      √ should return 400 for invalid pollutant type (28 ms)
      √ should handle empty records (36 ms)
    GET /stations/nearest
      √ should GET stations within a specified radius (31 ms)
      √ should return 400 for missing query parameters (13 ms)
    GET /stations/:stationID/summary
      √ should GET a summary of pollution records for a station (22 ms)
      √ should return 404 for a non-existent station (20 ms)

Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        7.091 s
Ran all test suites.
```

### Running the Tests

To run the unit tests locally (which dynamically spins up a containerized database, applies migrations, runs Jest, and downs the database):
```sh
pnpm run test:docker
```

## Docker Container Deployment & Security Architecture

To build and launch the API server and database services via Docker:
```sh
docker compose up --build
```

### Security & Architecture Design Choices

#### 1. Loopback Binding (`127.0.0.1`)
In `docker-compose.yml`, all exposed ports are explicitly bound to the loopback interface (`127.0.0.1`):
* API: `127.0.0.1:7000:7000`
* PostgreSQL: `127.0.0.1:5435:5435`

**Why?** By default, Docker exposes ports on `0.0.0.0` (all interfaces), which opens the ports to the public internet if the host machine has a public IP. Binding to `127.0.0.1` locks down the network interface so the database and API are only accessible locally on the host machine or via a reverse proxy (e.g. Nginx).

#### 2. Non-Standard Port Mapping
PostgreSQL is configured to run internally and externally on port `5435` instead of the default `5432`.
**Why?** This prevents port conflicts with any existing default PostgreSQL instances running natively on the host system, and adds a minor layer of security obscurity.

#### 3. Inter-Container Integration (Connecting other projects)
If you want another project or container to interact with this PostgreSQL instance:
* **From the host system**: Connect using `postgresql://auzlex:<password>@localhost:5435/monitoring_db`.
* **From another Docker container**: Link the container to the same network (`monitoring_network`) and connect directly using `postgresql://auzlex:<password>@db:5435/monitoring_db` (using the container hostname `db` and port `5435`).

#### 4. Multi-Stage Build Optimization
The [Dockerfile](file:///c:/Users/charl/Documents/boring-projects/monitoring-stations-api/Dockerfile) is designed using multiple stages:
* `deps`: Installs both dependencies and devDependencies to compile and run checks.
* `prod-deps`: Installs only production dependencies (`pnpm install --prod`).
* `runner`: Contains only the compiled output (`dist`) and production `node_modules` from `prod-deps`.

**Why?** This keeps the final production Docker image extremely lightweight (removing compilers, Jest, TypeScript, and test packages) and limits the container attack surface by excluding unnecessary packages.


## Work in Progress / Next Steps

- Front End UI that uses this API

<!-- ## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any improvements or new features to add. -->

<!-- ## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details." > README.md -->