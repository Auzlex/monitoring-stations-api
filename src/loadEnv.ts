import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

function loadEnv(): void {
    // Skip reading .env if instructed (e.g., in GitHub Actions) 
    if (process.env.SKIP_ENV_FILE === 'true') { return; }

    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        return;
    }
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    for (const k in envConfig) {
        if (Object.prototype.hasOwnProperty.call(envConfig, k)) {
            process.env[k] = resolveEnvValue(envConfig[k], envConfig);
        }
    }
}

function resolveEnvValue(value: string, envConfig: Record<string, string>): string {
    const variableReferenceRegex = /\${(\w+)}/g;
    return value.replace(variableReferenceRegex, (_, varName) => {
        return envConfig[varName] || process.env[varName] || '';
    });
}

export default loadEnv;
