import common from "./common";
import nav from "./nav";
import auth from "./auth";
import spaces from "./spaces";
import tasks from "./tasks";
import dashboard from "./dashboard";
import bugs from "./bugs";
import goals from "./goals";
import mytasks from "./mytasks";
import sprints from "./sprints";
import automations from "./automations";
import inbox from "./inbox";
import chat from "./chat";
import forms from "./forms";
import senders from "./senders";
import views from "./views";
import attendance from "./attendance";
import errors from "./errors";
import success from "./success";

const en = {
  ...common,
  ...nav,
  ...auth,
  ...spaces,
  ...tasks,
  ...dashboard,
  ...bugs,
  ...goals,
  ...mytasks,
  ...sprints,
  ...automations,
  ...inbox,
  ...chat,
  ...forms,
  ...senders,
  ...views,
  ...attendance,
  ...errors,
  ...success,
} as const;

export default en;
