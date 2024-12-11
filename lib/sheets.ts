import { google } from 'googleapis';

interface ServiceAccountCredentials {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}

const decodedKey = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!!, 'base64').toString('utf-8');
const serviceAccountKey = JSON.parse(decodedKey) as ServiceAccountCredentials;

// Cargar las credenciales desde el archivo JSON
const auth = new google.auth.GoogleAuth({
    // keyFile: path.join(process.cwd(), 'config/google-service-account.json'),  // Usamos process.cwd() para asegurar que sea la raíz del proyecto
    credentials: serviceAccountKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Crear un cliente de la API de Sheets
const sheets = google.sheets({ version: 'v4', auth });

export { sheets };
