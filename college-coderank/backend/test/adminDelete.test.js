import assert from "node:assert/strict";
import test from "node:test";
import Student from "../src/models/Student.js";
import { deleteStudent } from "../src/controllers/adminController.js";

function createResponse() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test("admin student deletion removes the full student record", async (context) => {
  const id = "507f1f77bcf86cd799439011";
  const student = { _id: { toString: () => id } };
  const findByIdAndDelete = context.mock.method(Student, "findByIdAndDelete", async () => student);
  const res = createResponse();
  let nextError;

  await deleteStudent({ params: { id } }, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(findByIdAndDelete.mock.calls.length, 1);
  assert.equal(findByIdAndDelete.mock.calls[0].arguments[0], id);
  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /all saved coding history deleted/i);
});

test("admin student deletion returns 404 when the student does not exist", async (context) => {
  context.mock.method(Student, "findByIdAndDelete", async () => null);
  const res = createResponse();

  await deleteStudent({ params: { id: "507f1f77bcf86cd799439011" } }, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "Student not found.");
});

test("admin student deletion rejects malformed IDs without querying MongoDB", async (context) => {
  const findByIdAndDelete = context.mock.method(Student, "findByIdAndDelete");
  const res = createResponse();

  await deleteStudent({ params: { id: "not-an-object-id" } }, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Invalid student ID.");
  assert.equal(findByIdAndDelete.mock.calls.length, 0);
});
