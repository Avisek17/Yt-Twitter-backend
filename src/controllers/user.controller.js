import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId) ;
        const accessToken = user.generateAccessToken() ;
        const refreshToken = user.generateRefreshToken() ;

        user.refreshToken = refreshToken ;
        await user.save({ validateBeforeSave: false }) ;
        return { accessToken, refreshToken } ;

    } catch (error) {
        throw new ApiError("Failed to generate tokens", 500) ;  
    }
}

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
    new ApiResponse(201,"User registered successfully", createdUser)
);

})

const loginUser = asyncHandler(async (req, res) => {
    const { username , email , password } = req.body ;
    console.log(username);

    if (!username && !email) {
        throw new ApiError("Username or email is required", 400);
    }

    const user = await User.findOne({
        $or: [ { username }, { email } ]
    })
        if(!user) {
            throw new ApiError("User not found", 404) ;
        }

        if(!password || password.trim() === "") {
            throw new ApiError("Password is required", 400);
        }

    const isPasswordValid = await user.isPassswordCorrect(password) ;
    if(!isPasswordValid) {
        throw new ApiError("Invalid password", 400) ;
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id) ;

    const userData = await User.findById(user._id).select('-password -refreshToken') ;

    const options = {
        httpOnly: true,
        secure: true ,
    };

    return res
        .status(200)
        .cookie('refreshToken', refreshToken, options)
        .cookie('accessToken', accessToken, options)
        .json(new ApiResponse({ user: userData, accessToken, refreshToken }, "Login successful", 200));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true });

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie('refreshToken', options)
        .clearCookie('accessToken', options)
        .json(new ApiResponse(null, "Logout successful", 200));
});

export { registerUser, loginUser, logoutUser };