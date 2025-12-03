import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    
   const {username , password, email , fullName} = req.body;
    console.log(req.body);


if(
    [username, password, email, fullName , ].some((field) => field?.trim() === "")) {
    throw new ApiError("All fields are required" , 400) ;
}

const existingUser = await User.findOne({ 
    $or: [ { username }, { email } ] });
if (existingUser) {
    throw new ApiError("Username or email already in use", 400);
}


const avatarLocalPath = req.files?.avatar?.[0]?.path;

const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

if(!avatarLocalPath) {
    throw new ApiError("Avatar image is required", 400) ;
}

const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

if(!avatar) {
    throw new ApiError("Failed to upload avatar image", 500) ;
}

const user = await User.create({
    username: username.toLowerCase()   ,
    password,
    email,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
});

const createdUser = await User.findById(user._id).select('-password -refreshToken');

if(!createdUser) {
    throw new ApiError("User registration failed", 500) ;
}   

res.status(201).json(
    new ApiResponse(200,"User registered successfully", createdUser)
);

})

export { registerUser };
