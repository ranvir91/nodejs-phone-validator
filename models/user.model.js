import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true
    },
    name : {
        type : String,
        required : true,
        trim : true
    },
    password : {
        type : String,
        required : true,
        trim : true
    },
    refreshToken : {
        type : String
    }
}, {timestamps : true});


// middleware to encrypt password before saving data to the users collection / table
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

//generate access token here
userSchema.methods.generateAccessToken = async function() {
    return jwt.sign(
      {
        _id : this._id,
        email : this.email,
        name : this.name
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
      }
    );
}

//generate refresh token here
userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}


export const User = mongoose.model('User', userSchema);
