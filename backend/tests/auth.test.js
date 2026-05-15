import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/database.js";

describe("Auth Endpoints", () => {
  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Cerrar conexión después de los tests
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully",
      );
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 400 for invalid email", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        password: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Error de validación");
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            campo: "email",
            mensaje: expect.stringContaining("Email inválido"),
          }),
        ]),
      );
    });

    it("should return 400 for weak password", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "weak",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Error de validación");
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            campo: "password",
            mensaje: expect.stringContaining("contraseña debe contener"),
          }),
        ]),
      );
    });

    it("should return 409 for duplicate email", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      };

      // Primer registro
      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Segundo registro con mismo email
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty("error", "User already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Crear usuario para tests de login
      await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      });
    });

    it("should login successfully with correct credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 400 for invalid email format", async () => {
      const loginData = {
        email: "invalid-email",
        password: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Error de validación");
    });

    it("should return 401 for wrong password", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty("error", "Invalid credentials");
    });

    it("should return 401 for non-existent user", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty("error", "Invalid credentials");
    });
  });
});
