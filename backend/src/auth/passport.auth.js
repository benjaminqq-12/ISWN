"use strict";
import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";

import UsuarioSchema from "../entity/usuario.entity.js";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js";
import { AppDataSource } from "../config/configDb.js";

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: ACCESS_TOKEN_SECRET,
};

const verifyUser = async (jwt_payload, done) => {
  try {
    const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);

    const userFound = await usuarioRepository.findOne({
      where: { usuarioEmail: jwt_payload.email },
    });

    if (userFound?.activo) return done(null, userFound);

    return done(null, false);

  } catch (error) {
    console.error("Error validando el token JWT:", error);
    return done(error, false);
  }
};

export const passportJwtSetup = () => {
  passport.use(new JwtStrategy(jwtOptions, verifyUser));
};