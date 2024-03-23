import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { google } from 'googleapis';
import bodyParser from 'body-parser';
import axios from 'axios';
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
    res.send('Server is running 🚀');
});


app.post('/register', (req, res) => {
    return new Promise(async (resolve, reject) => {
        const data = req.body;
        // Given UTC timestamp
        const utcTimestamp = new Date(`${data.date}`);

        // Convert and format the UTC timestamp to IST (Indian Standard Time)
        const formattedTimestamp = new Date(utcTimestamp.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        });

        console.log(formattedTimestamp); // Output: 12 Mar 2024 11:00 PM

        if (!data) return res.json({ message: 'User Data Missing' });
        try {
            sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'A1',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [
                        [data.name, data.number, formattedTimestamp]
                    ]
                },
                auth: auth
            }, (err, result) => {
                if (err) {
                    console.log(`can't append data to the sheet`)
                    return resolve(true);
                } else {
                    res.json({ success: true, message: 'Data added successfully 😎' });
                }
            });
            await slackNotification(data, formattedTimestamp)
            return resolve(true);
        }
        catch (err) {
            console.log(`Can't append data to the sheet`)
            console.log(err);
            return resolve(true);
        }
    });
});


async function slackNotification(message, date) {
    console.log('sending slack notification....')
    const url = 'https://hooks.slack.com/services/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'
    const data = {
        text: `New registration: \nName: ${message.name} \nNumber: ${message.number} \nDate: ${date}`
    }
    axios.post(url, data)
        .then((res) => {
            if (res.status === 200) {
                console.log('Slack notification sent successfully 🚀')
            }
        })
        .catch((error) => {
            console.error('Error while sending slack notification');
        });
}

app.use('/', express.static('.output/public'));

app.use('/**', express.static('.output/public/index.html'));

app.set('trust proxy', true);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

