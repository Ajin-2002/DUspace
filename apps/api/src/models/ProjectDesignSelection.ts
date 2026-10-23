import mongoose, { Document, Schema } from "mongoose";
import { DesignConfiguration, DesignTarget } from "../design-library/templates";

export interface IProjectDesignSelection extends Document {
  projectId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  templateId: string;
  templateVersion: number;
  targetComponentType: DesignTarget;
  configuration: DesignConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectDesignSelectionSchema = new Schema<IProjectDesignSelection>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectWorkspace", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    templateId: { type: String, required: true, maxlength: 80 },
    templateVersion: { type: Number, required: true, min: 1 },
    targetComponentType: { type: String, enum: ["page", "navigation", "component", "form", "dialog"], required: true },
    configuration: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { timestamps: true },
);

ProjectDesignSelectionSchema.index({ ownerId: 1, projectId: 1, templateId: 1, targetComponentType: 1 }, { unique: true });

export default mongoose.model<IProjectDesignSelection>("ProjectDesignSelection", ProjectDesignSelectionSchema);
