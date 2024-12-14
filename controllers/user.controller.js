import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";


// register user
const registerUser = asyncHandler(async(req, res)=> {
    // get parameters from front or form data
    const {name , email, password} = req.body;

    // console.log(req.body, 'dddd');

    if(email==="") {
        throw new ApiError(400, "Error in register user, Email is required");
    }
    if(name==="") {
        throw new ApiError(400, "Error in register user, Name is required");
    }
    if(password==="") {
        throw new ApiError(400, "Error in register user, Password is required");
    }

    // if all variables are ok then save to database
    const user = await User.create({
        name : name ,
        email,
        password
    });
    // if key value are same name then we can write as like this also in ES6 (email and password)

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser) {
        throw new ApiError(500, "Error while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully.")
    );

});

// login user
const loginUser = asyncHandler(async(req, res)=> {
    const { email, password} = req.body;

    if(!email) {
        throw new ApiError(400, "Email is required");        
    }
    if(!password) {
        throw new ApiError(400, "Password is required");        
    }

    const user = await User.findOne({
        $or : [ {email} ]
    });

    if(!user) {
        throw new ApiError(404, "User doesnot exists");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const cookieOptions = { httpOnly : true, secure: true};

    res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(200, {
            user : loggedInUser,
            accessToken : accessToken,
            refreshToken : refreshToken,
        },
        "User logged in successfully"
        )
    )

});


// logout user
const logoutUser = asyncHandler(async (req, res) => {
    // console.log(`dddd dd`);
    
    if(!req.user._id) return null;

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged Out"))    
});

// logout user
const validateNumber = asyncHandler(async (req, res) => {

    const {phonenumber} = req.body;

    console.log(req.body, "dddd");
    

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Number validated successfully.")
    );    
});

// generate access token for authentication here
const generateAccessAndRefreshToken = async (userid) => {
    try {
        const user = await User.findById(userid); // get from db
        let accessToken = user.generateAccessToken();
        let refreshToken = user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        await user.save({
            validateBeforeSave: false
        });

        accessToken = await accessToken.then(token => {
          return token;
        }).catch(error => {
          console.error('Error in getting accesstoken:', error);
        });

        refreshToken = await refreshToken.then(token => {
          return token;
        }).catch(error => {
          console.error('Error in getting refreshtoke form Promise:', error);
        });

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Error while generating access and refresh token");         
    }
}


export { registerUser, loginUser, logoutUser, validateNumber}
