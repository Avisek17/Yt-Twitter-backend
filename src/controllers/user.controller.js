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

const refreshAccessToken = asyncHandler(async (req, res)=> {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request")
    }
    try {
        const decodedToken = JsonWebTokenError.verify(decodedToken, process.env.REFRESH_TOKEN_SECRET)

    const user = User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid Refresh Token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh Token is expired")
    }
    const options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken, newRefreshToken}= await generateAccessAndRefreshTokens(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("RefreshToken", newRefreshToken,options)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token Refreshed"
        )
    )
    } catch (error) {
        throw new ApiError(200, error?.message || "Invalid Refresh Token")        
    }
})

const changeCurrentPassword = asyncHandler(async (req, res)=> {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPassswordCorrect = await user.isPassswordCorrect(oldPassword)

    if(!isPassswordCorrect){
        throw new ApiError(400,"Invalid Password")
    }

    user.password = newPassword 
    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(200,{},"Password changed succcessfully")

})

const getCurrentUser = asyncHandler(async(req, res)=> {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "USer fetched Successfully"
    ))
})

const updateAccountDetail = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
         {
                new : true
            }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200,user, "Account Details Updated Sucessfully"
    ))
})

const updateAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }
    fs.unlinkSync(avatarLocalPath)

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .ststus(200)
    .json(new ApiResponse(
        200,user, "Avatar updated Successfully"
    ))
})

const updateCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.files?.path
    if(!coverImageLocalPath){
        throw new ApiError(
            400,"Cover Image Not found"
        )
    }

    fs.unlinkSync(coverImageLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError( 400 , "Cover image upload failed")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
      { 
         $set : {
            coverImage: coverImage.url
        }
    },
        {new : true}
    ).select("-password")

        return res
    .status(200)
    .json(new ApiResponse(
        200, user, "Cover Image Updated Successfully"
    ))
})

const getUserChannelProfile  = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
            username: username?.toLowerCase()
        }
    },{
        $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },{
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscribers",
            as:"subscribedTo"
        }
    },{
        $addFields:{
            subscribersCount:{
                $size: "$subscribers"
            },
            channelSubscribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscribed : {
                $cond:{
                    if: {$in:[req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project:{
            fullName:1,
            username:1,
            subscribersCount:1,
            channelSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1
        }
    }
    ])

        if(!channel?.length){
            throw new ApiError(404, "channel does not exist")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,channel[0], "User channel fetched Successfully"
            )
        )

})

const getWatchHistory = asyncHandler(async (req, res)=>{

    const user = await User.aggregate([
        {
            $match: {
                _id: new Schema.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "users",
                localField: "owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },{
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        }
    ])

    return res.status(200)
    .json(
        new ApiResponse(
            200,user[0],getWatchHistory,"watch history fetcehd successfully"
        )
    )
})


export { 
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory 
};