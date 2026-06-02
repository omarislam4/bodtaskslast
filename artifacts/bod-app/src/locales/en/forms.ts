const forms = {
  forms: "Forms",
  newForm: "New Form",
  createForm: "Create Form",
  formTitleLabel: "Form Title",
  publicFormLink: "Public Link",
  formSubmissions: "Submissions",
  noForms: "No forms yet",
  noFormsDesc: "Create forms to collect task requests from anyone.",
  copyLink: "Copy Link",
  submitForm: "Submit",
  formField: "Field",
  addFormField: "Add Field",
  fieldType: "Field Type",
  fieldLabel: "Field Label",
  required: "Required",
  textField: "Text",
  numberField: "Number",
  dateField: "Date",
  dropdownField: "Dropdown",
  checkboxField: "Checkbox",
  formLinkedSpace: "Linked Space",
  // Custom Fields
  customFields: "Custom Fields",
  addCustomField: "Add Custom Field",
  noCustomFields: "No custom fields",
  noCustomFieldsDesc: "Add custom fields to capture extra info on your tasks.",
  fieldName: "Field Name",
} as const;

export type FormsKeys = keyof typeof forms;
export default forms;
