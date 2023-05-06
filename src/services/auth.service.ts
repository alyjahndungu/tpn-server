const UserModel = require("../models/user");

export const getUserByEmail = (email: string) => UserModel.findOne({ email });

export const getUserById = (_id: any) => UserModel.findById({ _id });

export const createUser = (values: Record<string, any>) =>
  new UserModel(values).save().then((user: any) => user.toObject());

export const updateUser = (_id: string, values: Record<string, any>) =>
  UserModel.findByIdAndUpdate(_id, values, { new: true, omitUndefined: true });

export const updateUserRole = (_id: string, values: Record<string, any>) =>
  UserModel.findByIdAndUpdate(_id, values);
