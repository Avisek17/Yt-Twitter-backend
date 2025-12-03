import {app} from './app.js';
import dotenv from 'dotenv';
import connectDB from './db/db.js';
dotenv.config(
    {
        path: './.env'
    }
);


connectDB()
    .then(() => {
        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection failed:', error);
    });
