// contains the logic it will recieve the request , validate input create a user , save the user and return the response

const User = require("../models/user.model");
const bcrypt = require("bcryptjs");

//imports JWT(JSON web token ) , a way to identify user after they login without storing their session  on the server

const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    console.log(user);


    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
    });

  } 
  catch (error) {
    console.error("Registration Error:", error);

    res.status(500).json({
        success: false,
        message: error.message,
    });
  }
};

// fuction to check and verify the login of an user by mapping it to the stored users in the database
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } 
  
  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



const profile = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  profile,
};