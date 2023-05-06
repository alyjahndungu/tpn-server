import { Request, Response, NextFunction } from "express";
// const { getUserByEmail, getUserById } = require("../models/user");
import {
  getUserByEmail,
  getUserById,
  updateUser,
} from "../services/auth.service";
const UserModel = require("../models/user");

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();

const authorize = require("../middleware/auth");
const { check, validationResult } = require("express-validator");

// Sign-up
router.post(
  "/register",
  [
    check("firstName")
      .not()
      .isEmpty()
      .isLength({ min: 3 })
      .withMessage("firstName must be at least 3 characters long"),
    check("lastName")
      .not()
      .isEmpty()
      .isLength({ min: 3 })
      .withMessage("lastName must be at least 3 characters long"),
    check("email", "Email is required").not().isEmpty(),
    check("phoneNumber", "Phone number is required").not().isEmpty(),
    check("password", "Password should be between 4 to 8 characters long")
      .not()
      .isEmpty()
      .isLength({ min: 4, max: 8 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).jsonp(errors.array());
    } else {
      await bcrypt.hash(req.body.password, 10).then((hash: string) => {
        const user = new UserModel({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
          password: hash,
        });

        user
          .save()
          .then((response: any) => {
            res.status(201).json({
              statusCode: 201,
              message: "User successfully created!",
              result: response,
            });
          })
          .catch((error: Error) => {
            res.status(500).json({
              error: error,
            });
          });
      });
    }
  }
);
// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword)
      return res.status(400).json({ error: "Password is wrong" });

    const payload = { email, role: user.role, userId: user._id };
    const jwtToken = jwt.sign(payload, "xenon-secret", { expiresIn: "6h" });

    return res.status(200).json({
      statusCode: 200,
      accessToken: jwtToken,
      expiresIn: "6h",
      _id: user._id,
    });
  } catch (error) {
    return res.status(401).json({
      message: "Authentication failed, Please check your credentials",
    });
  }
});

router
  .route("/users/:id")
  .get(authorize, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await getUserById(id);
      return res.status(200).json(user);
    } catch (error) {
      return res.sendStatus(error);
    }
  });

// Update User
router
  .route("/users/:id")
  .patch(authorize, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await updateUser(id, req.body);
      return res
        .status(200)
        .json({ message: "User updated successfully" })
        .end();
    } catch (error) {
      return res.sendStatus(error);
    }
  });

router
  .route("/users/:id/update-role")
  .patch(authorize, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await getUserById(id);
      user.role = role;
      await user.save();
      return res
        .status(200)
        .json({ message: "Roles updated successfully" })
        .end();
    } catch (error) {
      return res.sendStatus(error);
    }
  });

router
  .route("/users/:id/change-password")
  .patch(authorize, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const user = await getUserById(id);
      const hashPassword = await bcrypt.hash(password, 10);
      user.password = hashPassword;

      await user.save();
      return res
        .status(200)
        .json({ message: "Password changed successfully" })
        .end();
    } catch (error) {
      return res.sendStatus(error);
    }
  });
module.exports = router;
