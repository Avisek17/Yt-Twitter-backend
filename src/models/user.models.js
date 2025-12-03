import mongoose , { Schema , model } from 'mongoose' ;
import { use } from 'react';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    fullName: {
        type: String,
        required: true,
        index: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,    //from cloudinary
        required: true,
    },
    coverImage: {
        type: String,    //from cloudinary
    },
    refreshToken: {
        type: String,
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Video',
    }]
},{ timestamps: true });

export const User = model('User' , userSchema) ;