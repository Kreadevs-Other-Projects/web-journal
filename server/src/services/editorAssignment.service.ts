import { assignEditor } from "../repositories/editorAssignment.repository";

export const assignEditorService = async (
  user: { id: string; role: string },
  paper_id: string,
  sub_editor_id: string,
) => {
  if (!["owner", "editor"].includes(user.role)) {
    throw new Error("Only owner or editor can assign sub-editor");
  }

  return await assignEditor(paper_id, sub_editor_id, user.id);
};
