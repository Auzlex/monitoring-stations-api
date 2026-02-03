const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadEnv() {

    // Skip reading .env if instructed (e.g., in GitHub Actions) 
    if (process.env.SKIP_ENV_FILE === 'true') { return; }

    const envPath = path.resolve(__dirname, '.env');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    for (const k in envConfig) {
        if (envConfig.hasOwnProperty(k)) {
            process.env[k] = resolveEnvValue(envConfig[k], envConfig);
        }
    }
}

function resolveEnvValue(value, envConfig) {
    const variableReferenceRegex = /\${(\w+)}/g;
    return value.replace(variableReferenceRegex, (_, varName) => {
        return envConfig[varName] || process.env[varName] || '';
    });
}

module.exports = loadEnv;