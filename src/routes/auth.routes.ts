import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
const { getUserByEmail, getUserById } = require("../models/user");
const UserModel = require("../models/user");

import { User } from "../types";

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
      .withMessage("firstName must be atleast 3 characters long"),
    check("lastName")
      .not()
      .isEmpty()
      .isLength({ min: 3 })
      .withMessage("lastName must be atleast 3 characters long"),
    check("email", "Email is required").not().isEmpty(),
    check("password", "Password should be between 5 to 8 characters long")
      .not()
      .isEmpty()
      .isLength({ min: 5, max: 8 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    console.log(req.body);
    if (!errors.isEmpty()) {
      return res.status(422).jsonp(errors.array());
    } else {
      bcrypt.hash(req.body.password, 10).then((hash: string) => {
        const user = new UserModel({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          password: hash,
        });
        user
          .save()
          .then((response: any) => {
            res.status(201).json({
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

    const payload = { email, userId: user._id };
    const jwtToken = jwt.sign(payload, "xenon-secret", { expiresIn: "2h" });

    return res.status(200).json({
      token: jwtToken,
      expiresIn: 3600,
      _id: user._id,
    });
  } catch (error) {
    return res.status(401).json({
      message: "Authentication failed",
    });
  }
});

router
  .route("/user-profile/:id")
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
  .route("/update-user/:id")
  .patch(authorize, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { body } = req.body;

      if (!body) {
        return res.sendStatus(400);
      }

      const user = await getUserById(id);
      user.firstName = body.firstName;
      user.lastName = body.lastName;
      user.email = body.email;

      await user.save();
      return res.status(200).json(user).end();
    } catch (error) {
      return res.sendStatus(error);
    }
  });

module.exports = router;
