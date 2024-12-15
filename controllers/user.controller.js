import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { VerificationCode } from "../models/verificationCode.model.js";
import { sendSMS } from "../utils/sendSMS.js";
// import { generateCode } from "../utils/CodeGenerator.js";


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

// generate 6 digit random code
const generateCode = () => Math.floor(100000 + Math.random() * 900000); // 6-digit code


// register user and send code on phone
const sendCode = asyncHandler(async(req, res)=> {
    // get parameters from front or form data
    const {name , email, password, phone} = req.body;
    const verificationcode = generateCode();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    // console.log(verificationcode, 'ddd');

    if(email==="") {
        throw new ApiError(400, "Error in register user, Email is required");
    }
    if(name==="") {
        throw new ApiError(400, "Error in register user, Name is required");
    }
    if(phone==="") {
        throw new ApiError(400, "Error in register user, Phone is required");
    }
    if(password==="") {
        throw new ApiError(400, "Error in register user, Password is required");
    }

    // Save or update the verification code
    await VerificationCode.findOneAndUpdate(
        { phone },
        { verificationCode: verificationcode, expiresAt, updatedAt: new Date() },
        { upsert: true, new: true }
    );

    // Send the code via twilio SMS
    await sendSMS(phone, `Your verification code is: ${verificationcode}`);

    // save user to the database
    const user = await User.create({
        name : name ,
        phone : phone,
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

    // create login session and set cookie here
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);
    const cookieOptions = {httpOnly: true, secure: true};

    // dont send created user data to response
    // =================================remove this later
    return res.status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(200, {
            user : createdUser,
            accessToken : accessToken,
            refreshToken : refreshToken,
        }, `Verification code sent successfully. Phone : ${phone}, Code: ${verificationcode}`)
    );

});

// resend code
const resendCode = asyncHandler(async(req, res) => {
    const { phone } = req.body;

    if (!phone) {
        throw new ApiError(400, "Phone is required");        
    }

    const newCode = generateCode(); // generate new code
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // Code expires in 2 minutes

    // Update the verification code for the phone number or create a new record if not present
    const result = await VerificationCode.findOneAndUpdate(
        { phone }, // Query to find the phone number
        { verificationCode: newCode, expiresAt, updatedAt: new Date() }, // Update data
        { upsert: true, new: true } // Create if not exists, return updated document
    );

    // Send the code via twilio SMS
    await sendSMS(phone, `Your verification code is: ${newCode}`);

    res.status(200)
    .json(
        ApiResponse(200, {expiresAt: result.expiresAt}, "Verification code resent successfully.")
    );
});


// verify code
const verifyCode = asyncHandler(async (req, res) => {

    const { phone, code } = req.body;
    // console.log(req.body, "dddd");    

    // fetch the record from db
    const record = await VerificationCode.findOne({
        phone: phone,
        verificationCode: code
    });
    // console.log(record);
    
    // if doesnot exists then throw error
    if (!record) {
        throw new ApiError(400, "Invalid verification code");        
    }
    // check if code is expired or not
    if (record.expiresAt < new Date()) {
        return res.status(400).json({ message: "Verification code expired. Please request a new one." });
    }

    // Mark user as verified
    await User.findOneAndUpdate(
        { phone },
        { isPhoneVerified: true, updatedAt: new Date() },
        { upsert: true, new: true }
    );

    // Optionally, delete the verification code record
    await VerificationCode.deleteOne({ phone });

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Phone number verified successfully.")
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


export { sendCode, resendCode, verifyCode, logoutUser }
