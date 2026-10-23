import {
  DesignConfiguration,
  DesignTarget,
  DesignTemplate,
  findTemplate,
  validateTemplateConfiguration,
} from "./templates";

export type DesignSelectionInput = {
  templateId: string;
  templateVersion: number;
  targetComponentType: DesignTarget;
  configuration: DesignConfiguration;
};

export type DesignSelectionValidation =
  | { valid: true; value: DesignSelectionInput & { template: DesignTemplate } }
  | { valid: false; code: string; message: string; status: number };

export function validateDesignSelectionInput(body: unknown): DesignSelectionValidation {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, code: "INVALID_SELECTION", message: "The design selection request is invalid.", status: 400 };
  }
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["templateId", "templateVersion", "targetComponentType", "configuration"].includes(key))) {
    return { valid: false, code: "INVALID_SELECTION", message: "The design selection request is invalid.", status: 400 };
  }
  const item = typeof input.templateId === "string" ? findTemplate(input.templateId) : undefined;
  if (!item) return { valid: false, code: "TEMPLATE_NOT_FOUND", message: "Template not found.", status: 404 };
  if (!Number.isSafeInteger(input.templateVersion) || input.templateVersion !== item.version) {
    return { valid: false, code: "TEMPLATE_VERSION_UNAVAILABLE", message: "That template version is unavailable. Refresh the library and try again.", status: 409 };
  }
  if (typeof input.targetComponentType !== "string" || !item.supportedComponentTypes.includes(input.targetComponentType as DesignTarget)) {
    return { valid: false, code: "INVALID_TARGET_TYPE", message: "The target component type is not supported by this template.", status: 400 };
  }
  if (!validateTemplateConfiguration(input.configuration)) {
    return { valid: false, code: "INVALID_TEMPLATE_CONFIGURATION", message: "The template configuration contains unsupported values.", status: 400 };
  }
  return {
    valid: true,
    value: {
      template: item,
      templateId: item.id,
      templateVersion: item.version,
      targetComponentType: input.targetComponentType as DesignTarget,
      configuration: input.configuration ?? {},
    },
  };
}
