import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/database.js";

describe("Tools Endpoints", () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Limpiar base de datos
    await prisma.tool.deleteMany();
    await prisma.user.deleteMany();

    // Crear usuario y obtener token
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/tools", () => {
    it("should get empty tools list", async () => {
      const response = await request(app)
        .get("/api/tools")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it("should return 401 without token", async () => {
      await request(app).get("/api/tools").expect(401);
    });

    it("should get user tools only", async () => {
      // Crear herramienta para el usuario
      await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Tool",
          type: "Software",
          url: "https://example.com",
          price: 99.99,
        });

      const response = await request(app)
        .get("/api/tools")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("Test Tool");
      expect(response.body[0].userId).toBe(userId);
    });
  });

  describe("POST /api/tools", () => {
    it("should create a new tool successfully", async () => {
      const toolData = {
        name: "VS Code",
        type: "IDE",
        url: "https://code.visualstudio.com",
        price: 0,
      };

      const response = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${authToken}`)
        .send(toolData)
        .expect(201);

      expect(response.body.name).toBe(toolData.name);
      expect(response.body.type).toBe(toolData.type);
      expect(response.body.url).toBe(toolData.url);
      expect(response.body.price).toBe(toolData.price);
      expect(response.body.status).toBe("ACTIVE");
      expect(response.body.userId).toBe(userId);
    });

    it("should return 400 for invalid URL", async () => {
      const toolData = {
        name: "Test Tool",
        type: "Software",
        url: "invalid-url",
        price: 99.99,
      };

      const response = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${authToken}`)
        .send(toolData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Error de validación");
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            campo: "url",
            mensaje: "URL inválida",
          }),
        ]),
      );
    });

    it("should return 400 for negative price", async () => {
      const toolData = {
        name: "Test Tool",
        type: "Software",
        price: -10,
      };

      const response = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${authToken}`)
        .send(toolData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Error de validación");
    });

    it("should return 401 without authentication", async () => {
      const toolData = {
        name: "Test Tool",
        type: "Software",
      };

      await request(app).post("/api/tools").send(toolData).expect(401);
    });
  });

  describe("PUT /api/tools/:id", () => {
    let toolId;

    beforeEach(async () => {
      // Crear herramienta para actualizar
      const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Original Tool",
          type: "Software",
          price: 50,
        });

      toolId = toolResponse.body.id;
    });

    it("should update tool successfully", async () => {
      const updateData = {
        name: "Updated Tool",
        price: 75.5,
      };

      const response = await request(app)
        .put(`/api/tools/${toolId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.price).toBe(updateData.price);
      expect(response.body.type).toBe("Software"); // unchanged
    });

    it("should return 404 for non-existent tool", async () => {
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";

      await request(app)
        .put(`/api/tools/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated" })
        .expect(404);
    });
  });

  describe("DELETE /api/tools/:id", () => {
    let toolId;

    beforeEach(async () => {
      const toolResponse = await request(app)
        .post("/api/tools")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Tool to Delete",
          type: "Software",
        });

      toolId = toolResponse.body.id;
    });

    it("should delete tool successfully", async () => {
      await request(app)
        .delete(`/api/tools/${toolId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Verificar que fue eliminado
      await request(app)
        .get(`/api/tools/${toolId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 404 for non-existent tool", async () => {
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";

      await request(app)
        .delete(`/api/tools/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
