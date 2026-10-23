import mongoose from "mongoose";

type MongoId = string | mongoose.Types.ObjectId;

export function projectOwnershipFilter(projectId: MongoId, ownerId: MongoId) {
  return { _id: projectId, ownerId };
}

export function projectResourceOwnershipFilter(projectId: MongoId, ownerId: MongoId) {
  return { projectId, ownerId };
}
