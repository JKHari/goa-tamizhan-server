import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { google } from 'googleapis';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 5000

app.use(cors());

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.CLIENT_EMAIL,
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n') || '',
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

const spreadsheetId = process.env.SPREADSHEET_ID;

app.get('/', (req, res) => {
    res.send('Server is running');
});


app.post('/register', (req, res) => {
    return new Promise((resolve, reject) => {
        const data = req.body;
        console.log(data, 'data on the body')
        if (!data) return res.json({ message: 'User Data Missing' });
        try {
            sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'A1',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [
                        [data.name, data.number, data.date]
                    ]
                },
                auth: auth
            }, (err, result) => {
                if (err) {
                    console.log(`can't append data to the sheet`)
                    return resolve(true);
                } else {
                    res.json({ message: 'Data added successfully 😎' });
                }
            });
            return resolve(true);
        }
        catch (err) {
            console.log(`Can't append data to the sheet`)
            console.log(err);
            return resolve(true);
        }
    });
});

app.use('/', express.static('.output/public'));

app.use('/**', express.static('.output/public/index.html'));

app.set('trust proxy', true);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

