import fs from "fs";
import 'dotenv/config';
import bcrypt from "bcrypt";
import express from 'express';
import Jimp = require("jimp");

const jwt = require('jsonwebtoken');

// filterImageFromURL
// helper function to download, filter, and save the filtered image locally
// returns the absolute path to the local image
// INPUTS
//    inputURL: string - a publicly accessible url to an image file
// RETURNS
//    an absolute path to a filtered image locally saved file
export async function filterImageFromURL(inputURL: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const photo = await Jimp.read(inputURL);
      const outpath =
        "/tmp/filtered." + Math.floor(Math.random() * 2000) + ".jpg";
      await photo
        .resize(256, 256) // resize
        .quality(60) // set JPEG quality
        .greyscale() // set greyscale
        .write(__dirname + outpath, (img) => {
          resolve(__dirname + outpath);
        });
    } catch (error) {
      reject(error);
    }
  });
}

// deleteLocalFiles
// helper function to delete files on the local disk
// useful to cleanup after tasks
// INPUTS
//    files: Array<string> an array of absolute paths to files
export async function deleteLocalFiles(files: Array<string>) {
  for (let file of files) {
    fs.unlinkSync(file);
  }
}

// generate encrypted password
export const encryptPassword = async (password: string) => {
  const rounds = 10
  const salt = await bcrypt.genSalt(rounds)
  return await bcrypt.hash(password, salt)
}

// compare encrypted password
export const comparePassword = async (password: string, encryptedPassword: string) => {
  return await bcrypt.compare(password, encryptedPassword)
}

// generate jwt token
export const generateToken = async (user: { username: string, email: string }) => {
  return await jwt.sign({ user }, process.env.SECRET, {
    expiresIn: "5h"
  });
}

// verify jwt token
const verifyToken = async (token: string) => {
  return await jwt.verify(token, process.env.SECRET)
}

// Auth middleware
export const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization || '';
    if (!token) return res.status(401).json({ status: 401, message: 'Unauthorized' });
    const decoded = await verifyToken(token);
    if (!decoded) return res.status(401).json({ status: 401, message: 'Unauthorized' });
    return next();
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error
    });
  }

}
