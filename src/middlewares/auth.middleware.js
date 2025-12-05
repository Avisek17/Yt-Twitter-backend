import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const verifyJWT =  asyncHandler(async (req, res, next) => {

   try {
     const token = req.cookies?.accessToken || req.headers('authorization')?.replace('Bearer ', '') ;
     if (!token) {
         throw new ApiError("Authentication token not found", 401) ;
     }
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) 
 
      const user =  await User.findById(decoded?._id).select('-password -refreshToken');
 
      if (!user) {
         throw new ApiError("User not found", 404) ;
      }
      req.user = user;
      next();
   } catch (error) {
    throw new ApiError("Invalid or expired token", 401) ;
   }
}) ;