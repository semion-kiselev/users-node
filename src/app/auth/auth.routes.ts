import { raiseServerError, raiseUnauthorized } from "app/@shared/errors/main";
import { applyValidation } from "app/@shared/utils/apply-validation";
import { LoginSchema, LogoutSchema } from "domain/auth/auth.schemas";
import { login, logout } from "domain/auth/auth.serivce";
import type { TokenPayloadBase } from "domain/auth/auth.types";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { validator } from "hono/validator";
import * as process from "process";

export const auth = new Hono();

auth.post(
  "/login",
  validator("json", (value) => applyValidation(value, LoginSchema)),
  async (c) => {
    const payload = c.req.valid("json");

    const { ACCESS_TOKEN_EXPIRATION_SECONDS, ACCESS_TOKEN_SECRET } = process.env;
    if (!ACCESS_TOKEN_EXPIRATION_SECONDS || !ACCESS_TOKEN_SECRET) {
      raiseServerError();
    }

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + Number(ACCESS_TOKEN_EXPIRATION_SECONDS);
    const signToken = (payload: TokenPayloadBase) =>
      sign({ ...payload, exp, iat }, ACCESS_TOKEN_SECRET);

    const { token } = await login(payload, raiseUnauthorized, signToken);
    return c.json({ token });
  }
);

auth.post(
  "/logout",
  validator("json", (value) => applyValidation(value, LogoutSchema)),
  async (c) => {
    const { id } = c.req.valid("json");
    await logout(id);
    return c.json({ ok: true });
  }
);
