"use strict";
import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";

import UsuarioSchema from "../entity/usuario.entity.js";
import VoluntarioSchema from "../entity/voluntario.entity.js";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js";
//import { AppDataSource } from "../config/configDb.js";

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: ACCESS_TOKEN_SECRET,
};

const verifyUser = async (jwt_payload, done) => {
  try {
    const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);
    const voluntarioRepository = AppDataSource.getRepository(VoluntarioSchema);
    
    const userFound = await voluntarioRepository.findOne({
      where: { email: jwt_payload.email },
      relations: ["rol"]
    });

    if (userFound) return done(null, userFound);

    const workerFound = await usuarioRepository.findOne({
      where: { email: jwt_payload.email },
    });

    if (workerFound) return done(null, workerFound);

    return done(null, false);

  } catch (error) {
    console.error("Error validando el token JWT:", error);
    return done(error, false);
  }
};

export const passportJwtSetup = () => {
  passport.use(new JwtStrategy(jwtOptions, verifyUser));
};