import jwt from "jsonwebtoken"
import User from "../models/User.js"

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided, authorization denied",
        code: "NO_TOKEN",
      })
    }

    const token = authHeader.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        message: "No token provided, authorization denied",
        code: "NO_TOKEN",
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId).select("-password")

      if (!user) {
        return res.status(401).json({
          message: "Token is not valid - user not found",
          code: "INVALID_TOKEN",
        })
      }

      if (!user.isActive) {
        return res.status(401).json({
          message: "Account is deactivated",
          code: "ACCOUNT_INACTIVE",
        })
      }

      req.user = user
      next()
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Token has expired",
          code: "TOKEN_EXPIRED",
        })
      } else if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          message: "Token is not valid",
          code: "INVALID_TOKEN",
        })
      } else {
        throw jwtError
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({
      message: "Server error in authentication",
      code: "SERVER_ERROR",
    })
  }
}

export default auth
