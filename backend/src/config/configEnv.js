"use strict";
import {config } from "dotenv"

config();

export const PORT = process.env.PORT;
export const HOST = process.env.HOST;
export const DB_USERNAME = process.env.DB_USERNAME;
export const PASSWORD = process.env.PASSWORD;
export const DATABASE = process.env.DATABASE;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const cookieKey = process.env.cookieKey;
