import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db/db.js';
dotenv.config(
    {
        path: './.env'
    }
);
const app = express()

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
