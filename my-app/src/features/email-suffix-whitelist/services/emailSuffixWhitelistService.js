import axiosClient from "@/services/axiosClient";

export const emailSuffixWhitelistService = {
  getRules: () => axiosClient.get("/email-suffix-whitelist"),
  createRule: (suffix) =>
    axiosClient.post("/email-suffix-whitelist", { suffix }),
  deleteRule: (ruleId) => axiosClient.delete(`/email-suffix-whitelist/${ruleId}`),
};
