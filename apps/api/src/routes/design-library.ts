import { Response, Router } from "express";
import mongoose from "mongoose";
import { AuthRequest, requireDeveloper } from "../middleware/auth";
import ProjectBlueprint from "../models/ProjectBlueprint";
import ProjectDesignSelection from "../models/ProjectDesignSelection";
import ProjectWorkspace from "../models/ProjectWorkspace";
import { projectOwnershipFilter, projectResourceOwnershipFilter } from "../design-library/ownership";
import {
  designTemplates,
  evaluateCompatibility,
  filterTemplates,
  findTemplate,
} from "../design-library/templates";
import { validateDesignSelectionInput } from "../design-library/selection";

const router = Router();
router.use(requireDeveloper);

function error(res: Response, code: string, message: string, status = 400): void {
  res.status(status).json({ error: message, code });
}

function validProjectId(value: unknown): value is string {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

async function ownedProject(projectId: string, ownerId: string, res: Response) {
  const project = await ProjectWorkspace.findOne(projectOwnershipFilter(projectId, ownerId));
  if (!project) {
    error(res, "PROJECT_NOT_FOUND", "Project not found.", 404);
    return null;
  }
  return project;
}

async function latestBlueprint(projectId: mongoose.Types.ObjectId, ownerId: string) {
  return ProjectBlueprint.findOne({ ...projectResourceOwnershipFilter(projectId, ownerId), schemaVersion: 1 }).sort({ analysisVersion: -1 }).select("blueprint analysisVersion");
}

router.get("/templates", async (req: AuthRequest, res: Response) => {
  try {
    const knownCategories = ["dashboard", "navigation", "component", "forms", "settings", "dialogs", "profile", "landing"];
    const requestedFramework = typeof req.query.framework === "string" ? req.query.framework : undefined;
    const requestedStylingSystem = typeof req.query.stylingSystem === "string" ? req.query.stylingSystem : undefined;
    if (typeof req.query.category === "string" && !knownCategories.includes(req.query.category)) {
      error(res, "INVALID_TEMPLATE_FILTER", "The template category filter is invalid.");
      return;
    }
    if (requestedFramework && ![...new Set(designTemplates.flatMap((item) => item.frameworks))].some((value) => value.toLowerCase() === requestedFramework.toLowerCase())) {
      error(res, "INVALID_TEMPLATE_FILTER", "The framework filter is invalid.");
      return;
    }
    if (requestedStylingSystem && ![...new Set(designTemplates.flatMap((item) => item.stylingSystems))].some((value) => value.toLowerCase() === requestedStylingSystem.toLowerCase())) {
      error(res, "INVALID_TEMPLATE_FILTER", "The styling system filter is invalid.");
      return;
    }
    const filters = {
      search: typeof req.query.q === "string" ? req.query.q.slice(0, 100) : undefined,
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      framework: typeof req.query.framework === "string" ? req.query.framework : undefined,
      stylingSystem: typeof req.query.stylingSystem === "string" ? req.query.stylingSystem : undefined,
    };
    let blueprint = null;
    if (req.query.projectId !== undefined) {
      if (!validProjectId(req.query.projectId)) {
        error(res, "INVALID_PROJECT_ID", "Invalid project ID.");
        return;
      }
      const project = await ownedProject(req.query.projectId, req.userId!, res);
      if (!project) return;
      blueprint = await latestBlueprint(project._id, req.userId!);
    }
    const templates = filterTemplates(filters).map((item) => ({
      ...item,
      compatibility: evaluateCompatibility(item, blueprint?.blueprint),
    }));
    res.json({ templates, projectAnalyzed: Boolean(blueprint), analysisVersion: blueprint?.analysisVersion ?? null });
  } catch {
    error(res, "DESIGN_LIBRARY_ERROR", "The design library could not be loaded.", 500);
  }
});

router.get("/templates/:templateId", async (req: AuthRequest, res: Response) => {
  try {
    const templateId = req.params.templateId;
    const item = typeof templateId === "string" ? findTemplate(templateId) : undefined;
    if (!item) {
      error(res, "TEMPLATE_NOT_FOUND", "Template not found.", 404);
      return;
    }
    let blueprint = null;
    if (req.query.projectId !== undefined) {
      if (!validProjectId(req.query.projectId)) {
        error(res, "INVALID_PROJECT_ID", "Invalid project ID.");
        return;
      }
      const project = await ownedProject(req.query.projectId, req.userId!, res);
      if (!project) return;
      blueprint = await latestBlueprint(project._id, req.userId!);
    }
    res.json({ template: { ...item, compatibility: evaluateCompatibility(item, blueprint?.blueprint) }, projectAnalyzed: Boolean(blueprint) });
  } catch {
    error(res, "DESIGN_LIBRARY_ERROR", "The template could not be loaded.", 500);
  }
});

router.get("/projects/:projectId/selections", async (req: AuthRequest, res: Response) => {
  try {
    if (!validProjectId(req.params.projectId)) {
      error(res, "INVALID_PROJECT_ID", "Invalid project ID.");
      return;
    }
    const project = await ownedProject(req.params.projectId, req.userId!, res);
    if (!project) return;
    const [selections, blueprint] = await Promise.all([
      ProjectDesignSelection.find(projectResourceOwnershipFilter(project._id, req.userId!)).sort({ targetComponentType: 1 }),
      latestBlueprint(project._id, req.userId!),
    ]);
    res.json({
      selections: selections.map((selection) => ({
        id: selection._id.toString(), templateId: selection.templateId, templateVersion: selection.templateVersion,
        targetComponentType: selection.targetComponentType, configuration: selection.configuration,
        createdAt: selection.createdAt, updatedAt: selection.updatedAt,
      })),
      projectAnalyzed: Boolean(blueprint),
      analysisVersion: blueprint?.analysisVersion ?? null,
    });
  } catch {
    error(res, "DESIGN_SELECTION_ERROR", "Project design selections could not be loaded.", 500);
  }
});

router.put("/projects/:projectId/selections", async (req: AuthRequest, res: Response) => {
  try {
    if (!validProjectId(req.params.projectId)) {
      error(res, "INVALID_PROJECT_ID", "Invalid project ID.");
      return;
    }
    const project = await ownedProject(req.params.projectId, req.userId!, res);
    if (!project) return;
    if (project.status !== "ready") {
      error(res, "PROJECT_NOT_READY", "Import the project successfully before saving a design selection.", 409);
      return;
    }
    const validated = validateDesignSelectionInput(req.body);
    if (!validated.valid) {
      error(res, validated.code, validated.message, validated.status);
      return;
    }
    const { template: item, templateId, templateVersion, targetComponentType, configuration } = validated.value;
    const compatibilityBlueprint = await latestBlueprint(project._id, req.userId!);
    const compatibility = evaluateCompatibility(item, compatibilityBlueprint?.blueprint);
    if (compatibility.level === "unsupported") {
      error(res, "TEMPLATE_UNSUPPORTED", "This template is incompatible with the analyzed project.", 422);
      return;
    }
    const selection = await ProjectDesignSelection.findOneAndUpdate(
      { ...projectResourceOwnershipFilter(project._id, req.userId!), templateId, targetComponentType },
      { $set: {
        templateId,
        templateVersion,
        targetComponentType,
        configuration,
      } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    res.json({ selection: {
      id: selection!._id.toString(), templateId: selection!.templateId, templateVersion: selection!.templateVersion,
      targetComponentType: selection!.targetComponentType, configuration: selection!.configuration,
      updatedAt: selection!.updatedAt,
    }, compatibility, applied: false });
  } catch {
    error(res, "DESIGN_SELECTION_ERROR", "The design selection could not be saved.", 500);
  }
});

export default router;
